import os
import json
from typing import Dict, Any

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.is_configured = False
        self.client = None

        if self.api_key and self.api_key != "your-gemini-api-key":
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                self.is_configured = True
            except Exception as e:
                print(f"Gemini setup error: {e}")

    def generate_insight(self, business_type: str, analytics_summary: Dict, root_cause_result: Dict, language: str = 'en') -> Dict:
        if not self.is_configured:
            return self._generate_fallback(analytics_summary, root_cause_result, language)

        prompt = self._build_prompt(business_type, analytics_summary, root_cause_result, language)

        try:
            from google import genai
            response = self.client.models.generate_content(
                model='gemini-3.5-flash-lite',
                contents=prompt
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text.replace("```json", "", 1).replace("```", "", 1).strip()
            elif text.startswith("```"):
                text = text.replace("```", "", 1).replace("```", "", 1).strip()

            result = json.loads(text)
            return result
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._generate_fallback(analytics_summary, root_cause_result, language)

    def _build_prompt(self, business_type, analytics_summary, root_cause, language):
        lang_str = "Hindi (Devanagari script)" if language == 'hi' else "English"

        # Extract detailed metrics for richer analysis
        current = analytics_summary.get('current_period', {})
        previous = analytics_summary.get('previous_period', {})
        trends = analytics_summary.get('trends', [])

        # Calculate key business ratios
        curr_sales = current.get('sales', 0)
        curr_expenses = current.get('expenses', 0)
        curr_footfall = current.get('footfall', 0)
        profit = curr_sales - curr_expenses
        profit_margin = (profit / curr_sales * 100) if curr_sales > 0 else 0
        rev_per_customer = (curr_sales / curr_footfall) if curr_footfall > 0 else 0
        expense_ratio = analytics_summary.get('avg_expense_ratio', 0)

        # Get recent daily data for pattern analysis
        recent_days = trends[-7:] if len(trends) >= 7 else trends
        daily_summary = ""
        for day in recent_days:
            daily_summary += f"  {day.get('date')}: Sales=₹{day.get('sales',0)}, Expenses=₹{day.get('expenses',0)}, Customers={day.get('customer_footfall',0)}, Stock=₹{day.get('stock_value',0)}\n"

        return f"""You are an expert Indian small business consultant. Analyze this {business_type} shop's data and give specific, practical advice to INCREASE PROFIT.

## Business Data (Current Period vs Previous):
- Total Sales: ₹{curr_sales:.0f} (Change: {analytics_summary.get('sales_change_pct', 0):.1f}%)
- Total Expenses: ₹{curr_expenses:.0f} (Change: {analytics_summary.get('expense_change_pct', 0):.1f}%)  
- Total Footfall: {curr_footfall:.0f} customers (Change: {analytics_summary.get('footfall_change_pct', 0):.1f}%)
- Current Profit: ₹{profit:.0f}
- Profit Margin: {profit_margin:.1f}%
- Revenue per Customer: ₹{rev_per_customer:.0f}
- Expense Ratio: {expense_ratio:.1f}%

## Detected Issue:
- Root Cause: {root_cause.get('root_cause')}
- Evidence: {', '.join(root_cause.get('evidence', []))}
- Severity: {root_cause.get('severity', 'medium')}

## Recent Daily Data:
{daily_summary}

## Your Task:
1. Analyze the data patterns — what's going well, what's going wrong
2. Identify the #1 thing hurting profits right now
3. Give 3-4 SPECIFIC, AFFORDABLE actions this shop owner can do THIS WEEK
4. Each recommendation must include: what to do, why it will help, and approximate cost

Think like a local business mentor talking to a shop owner in India. Be specific to a "{business_type}" business.
DO NOT invent numbers. Only use the data provided.

Respond ONLY with a valid JSON object in {lang_str}:
{{
    "explanation": "A clear 3-4 sentence analysis of business health. What's working, what's not, and the biggest opportunity for profit. Be specific with numbers from the data.",
    "evidence": ["Data point 1 with numbers", "Data point 2 with numbers", "Data point 3"],
    "recommendations": [
        {{"action": "Specific action step with details on HOW to do it", "estimated_cost": "₹ amount or Free/Low"}},
        {{"action": "Second specific action with implementation details", "estimated_cost": "₹ amount or Free/Low"}},
        {{"action": "Third specific action step", "estimated_cost": "₹ amount or Free/Low"}}
    ],
    "monitoring_period": "Number of days to wait before checking results (e.g. '7 days' or '14 days')"
}}"""

    def _generate_fallback(self, analytics_summary: Dict, root_cause_result: Dict, language: str) -> Dict:
        rc = root_cause_result.get('root_cause', '')

        # Calculate profit metrics for smarter fallback
        current = analytics_summary.get('current_period', {})
        curr_sales = current.get('sales', 0)
        curr_expenses = current.get('expenses', 0)
        curr_footfall = current.get('footfall', 0)
        profit = curr_sales - curr_expenses
        profit_margin = (profit / curr_sales * 100) if curr_sales > 0 else 0
        rev_per_customer = (curr_sales / curr_footfall) if curr_footfall > 0 else 0
        expense_ratio = analytics_summary.get('avg_expense_ratio', 0)

        sales_change = analytics_summary.get('sales_change_pct', 0)
        expense_change = analytics_summary.get('expense_change_pct', 0)
        footfall_change = analytics_summary.get('footfall_change_pct', 0)

        evidence = root_cause_result.get('evidence', [])

        # Add profit-related evidence
        evidence_extra = []
        if profit_margin > 0:
            evidence_extra.append(f"Current profit margin is {profit_margin:.1f}%")
        if rev_per_customer > 0:
            evidence_extra.append(f"Average revenue per customer is ₹{rev_per_customer:.0f}")
        if expense_ratio > 50:
            evidence_extra.append(f"Expense ratio is high at {expense_ratio:.1f}% of sales")
        
        all_evidence = evidence + evidence_extra

        if language == 'hi':
            return self._hindi_fallback(rc, curr_sales, curr_expenses, profit, profit_margin, rev_per_customer, expense_ratio, sales_change, footfall_change, all_evidence)
        else:
            return self._english_fallback(rc, curr_sales, curr_expenses, profit, profit_margin, rev_per_customer, expense_ratio, sales_change, footfall_change, all_evidence)

    def _english_fallback(self, rc, sales, expenses, profit, margin, rev_per_cust, exp_ratio, sales_change, footfall_change, evidence):
        if 'Declining customer footfall' in rc:
            explanation = f"Your customer visits have dropped by {abs(footfall_change):.1f}%, directly reducing sales. Your current profit is ₹{profit:.0f} with a {margin:.1f}% margin. The priority is getting more customers through your door — even a 10% increase in footfall could add ₹{sales*0.1:.0f} to your revenue."
            recs = [
                {"action": "Create a WhatsApp broadcast list of your regular customers and send them a special offer this week (e.g., 'Buy 2 items get 10% off'). Personal messages bring back 30% of lapsed customers.", "estimated_cost": "Free"},
                {"action": "Place a bright signboard or banner outside your shop highlighting your best-selling product with the price. Visibility drives walk-in traffic.", "estimated_cost": "₹200-500"},
                {"action": "Offer a small free item or discount to any customer who brings a friend. Word-of-mouth referrals are the cheapest marketing for local shops.", "estimated_cost": "₹300-500"},
                {"action": "Track which hours have the most and least customers. Consider special 'happy hour' deals during slow times to fill empty hours.", "estimated_cost": "Free"},
            ]
        elif 'Lower spending per customer' in rc:
            explanation = f"Customers are visiting but spending less — average revenue per customer is ₹{rev_per_cust:.0f}. Your total profit is ₹{profit:.0f}. To increase profit without getting more customers, focus on increasing the average bill value by ₹50-100 per customer."
            recs = [
                {"action": "Create 2-3 combo/bundle deals combining a popular item with a slower-moving one at a slight discount. Example: 'Buy shampoo + soap = save ₹10'. This increases average bill size.", "estimated_cost": "₹200-400"},
                {"action": "Place small, impulse-buy items (₹10-50 range) near the billing counter. Customers often add these without thinking.", "estimated_cost": "₹500-1000"},
                {"action": "Train yourself/staff to suggest one related product during every purchase. 'Would you also like batteries for that?' can add ₹30-50 per transaction.", "estimated_cost": "Free"},
            ]
        elif 'Increasing operating expenses' in rc:
            explanation = f"Your expenses are eating into profits — expense ratio is {exp_ratio:.1f}% of sales. Current profit is only ₹{profit:.0f}. If expenses had stayed flat, you'd have ₹{expenses * abs(sales_change)/100:.0f} more profit. Focus on cutting costs without affecting customer experience."
            recs = [
                {"action": "Review your top 3 expense categories this week. Often there's one supplier where you can negotiate 5-10% lower rates by committing to regular orders.", "estimated_cost": "Free"},
                {"action": "Switch to LED lights and turn off displays/AC in non-customer hours. This typically saves ₹500-1500/month on electricity.", "estimated_cost": "₹500-1000 one-time"},
                {"action": "Reduce wastage by tracking inventory more carefully. Remove slow-selling items from reorders and focus shelf space on top-20 sellers.", "estimated_cost": "Free"},
                {"action": "Compare prices from at least 2-3 suppliers for your top items. Even ₹1-2 saving per item adds up significantly over a month.", "estimated_cost": "Free"},
            ]
        elif 'Slow-moving inventory' in rc:
            explanation = f"Your stock value is increasing while sales are declining. Money locked in unsold inventory is money not earning profit. Current profit is ₹{profit:.0f}. Converting even 10% of dead stock to cash would improve your working capital significantly."
            recs = [
                {"action": "Identify your bottom 10 slowest-selling items this week. Run a '50% off clearance' on them — recovering some money is better than items sitting on shelves.", "estimated_cost": "Low (discount cost)"},
                {"action": "Stop reordering items that haven't sold in 30+ days. Redirect that budget to items that sell within a week.", "estimated_cost": "Free"},
                {"action": "Create a 'clearance corner' in your shop with discounted slow items. Some customers specifically look for deals.", "estimated_cost": "₹100-200 for signage"},
            ]
        elif 'Growing customer base' in rc:
            explanation = f"Great news! Your business is growing — sales up {sales_change:.1f}% and footfall up {footfall_change:.1f}%. Profit is ₹{profit:.0f} with {margin:.1f}% margin. Now is the time to maximize this momentum and increase profit margins while growth is strong."
            recs = [
                {"action": "Introduce a premium/higher-margin variant of your best-selling product. Growing customer base means some will pay more for better quality.", "estimated_cost": "₹1000-2000"},
                {"action": "Start a simple loyalty program — 'Buy 10 times, get 10% off next purchase'. This locks in your new customers for repeat visits.", "estimated_cost": "₹200 for stamp cards"},
                {"action": "Slightly increase prices (₹2-5) on your top 5 items. With growing demand, customers rarely notice small increases but it directly boosts profit.", "estimated_cost": "Free"},
                {"action": "Negotiate better bulk pricing with suppliers now that your volume is increasing. Show them your growing order sizes.", "estimated_cost": "Free"},
            ]
        else:
            explanation = f"Your business is running steadily with ₹{profit:.0f} profit and {margin:.1f}% margin. Revenue per customer is ₹{rev_per_cust:.0f}. There's room to improve — even small optimizations can add ₹{profit*0.15:.0f} to your monthly profit."
            recs = [
                {"action": "Focus on your top 5 selling products — make sure they're always in stock and prominently displayed. These drive most of your revenue.", "estimated_cost": "Free"},
                {"action": "Reduce your bottom 5 slowest items and replace shelf space with faster-moving products. Every square foot should earn money.", "estimated_cost": "Free"},
                {"action": "Start noting which day/time customers shop most. Run your best promotions during those peak times for maximum impact.", "estimated_cost": "Free"},
            ]

        return {
            "explanation": explanation,
            "evidence": all_evidence if 'all_evidence' in dir() else evidence,
            "recommendations": recs,
            "monitoring_period": "14 days"
        }

    def _hindi_fallback(self, rc, sales, expenses, profit, margin, rev_per_cust, exp_ratio, sales_change, footfall_change, evidence):
        if 'Declining customer footfall' in rc:
            explanation = f"आपकी दुकान पर ग्राहकों की संख्या {abs(footfall_change):.1f}% कम हुई है, जिससे बिक्री सीधे प्रभावित हो रही है। आपका मुनाफा ₹{profit:.0f} है और मार्जिन {margin:.1f}% है। अगर ग्राहक 10% भी बढ़ जाएं तो ₹{sales*0.1:.0f} अतिरिक्त बिक्री हो सकती है।"
            recs = [
                {"action": "अपने नियमित ग्राहकों की WhatsApp लिस्ट बनाएं और इस हफ्ते एक स्पेशल ऑफर भेजें (जैसे '2 चीज़ें खरीदें, 10% छूट पाएं')", "estimated_cost": "मुफ्त"},
                {"action": "दुकान के बाहर एक चमकीला साइनबोर्ड लगाएं जिसमें आपका सबसे लोकप्रिय प्रोडक्ट और कीमत दिखे", "estimated_cost": "₹200-500"},
                {"action": "जो ग्राहक दोस्त को लाए उसे छोटा डिस्काउंट दें — यह सबसे सस्ता मार्केटिंग तरीका है", "estimated_cost": "₹300-500"},
            ]
        elif 'Lower spending per customer' in rc:
            explanation = f"ग्राहक आ तो रहे हैं लेकिन कम खरीद रहे हैं — औसत बिल ₹{rev_per_cust:.0f} है। मुनाफा ₹{profit:.0f} है। हर ग्राहक का बिल ₹50-100 बढ़ जाए तो मुनाफा काफी बढ़ सकता है।"
            recs = [
                {"action": "2-3 कॉम्बो ऑफर बनाएं — लोकप्रिय चीज़ के साथ धीमी बिक्री वाली चीज़ मिलाकर थोड़ी छूट पर दें", "estimated_cost": "₹200-400"},
                {"action": "बिलिंग काउंटर के पास छोटी चीज़ें (₹10-50) रखें जो ग्राहक अतिरिक्त खरीद सकें", "estimated_cost": "₹500-1000"},
                {"action": "हर खरीदारी पर एक संबंधित प्रोडक्ट सुझाएं — 'क्या बैटरी भी चाहिए?' से बिल ₹30-50 बढ़ सकता है", "estimated_cost": "मुफ्त"},
            ]
        elif 'Increasing operating expenses' in rc:
            explanation = f"आपके खर्चे बिक्री का {exp_ratio:.1f}% हैं — यह बहुत ज़्यादा है। मुनाफा सिर्फ ₹{profit:.0f} है। खर्चे कम करने पर ध्यान दें।"
            recs = [
                {"action": "अपने सप्लायर से 5-10% कम रेट पर बात करें — नियमित ऑर्डर का वादा करके", "estimated_cost": "मुफ्त"},
                {"action": "LED लाइट्स लगाएं और गैर-ज़रूरी समय में AC/डिस्प्ले बंद करें — बिजली ₹500-1500/महीना बचेगी", "estimated_cost": "₹500-1000"},
                {"action": "धीमी बिक्री वाले सामान को दोबारा ऑर्डर करना बंद करें और टॉप-20 प्रोडक्ट्स पर फोकस करें", "estimated_cost": "मुफ्त"},
            ]
        else:
            explanation = f"आपकी दुकान ₹{profit:.0f} मुनाफा कमा रही है और मार्जिन {margin:.1f}% है। प्रति ग्राहक बिक्री ₹{rev_per_cust:.0f} है। छोटे सुधारों से मुनाफा ₹{profit*0.15:.0f} तक बढ़ सकता है।"
            recs = [
                {"action": "टॉप 5 बिकने वाले प्रोडक्ट्स का स्टॉक हमेशा रखें और उन्हें सामने रखें", "estimated_cost": "मुफ्त"},
                {"action": "सबसे कम बिकने वाले 5 प्रोडक्ट्स हटाकर तेज़ बिकने वाले रखें", "estimated_cost": "मुफ्त"},
                {"action": "कौन से दिन/समय सबसे ज़्यादा ग्राहक आते हैं — वहीं प्रमोशन चलाएं", "estimated_cost": "मुफ्त"},
            ]

        return {
            "explanation": explanation,
            "evidence": evidence,
            "recommendations": recs,
            "monitoring_period": "14 दिन"
        }

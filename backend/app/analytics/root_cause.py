class RootCauseEngine:
    def __init__(self):
        pass

    def detect(self, analytics_summary):
        sales_change = analytics_summary.get('sales_change_pct', 0)
        footfall_change = analytics_summary.get('footfall_change_pct', 0)
        expense_change = analytics_summary.get('expense_change_pct', 0)
        avg_revenue_per_customer = analytics_summary.get('avg_revenue_per_customer', 0)
        avg_expense_ratio = analytics_summary.get('avg_expense_ratio', 0)

        # Check stock changes from trend data
        trends = analytics_summary.get('trends', [])
        stock_values = [t.get('stock_value', 0) for t in trends] if isinstance(trends, list) else []
        stock_change = 0
        if len(stock_values) >= 2:
            first_half = sum(stock_values[:len(stock_values)//2]) / max(len(stock_values)//2, 1)
            second_half = sum(stock_values[len(stock_values)//2:]) / max(len(stock_values) - len(stock_values)//2, 1)
            if first_half > 0:
                stock_change = ((second_half - first_half) / first_half) * 100

        root_cause = "Normal operations"
        evidence = []
        severity = "low"
        confidence = 0.8

        sales_down = sales_change < -5
        sales_up = sales_change > 5
        footfall_down = footfall_change < -5
        footfall_up = footfall_change > 5
        footfall_stable = -5 <= footfall_change <= 5
        expenses_up = expense_change > 10
        stock_up = stock_change > 10

        # Rule 1: Sales down and footfall down
        if sales_down and footfall_down:
            root_cause = "Declining customer footfall"
            evidence.append(f"Sales decreased by {abs(sales_change):.1f}%")
            evidence.append(f"Customer visits decreased by {abs(footfall_change):.1f}%")
            if avg_revenue_per_customer > 0:
                evidence.append(f"Average revenue per customer: ₹{avg_revenue_per_customer:.0f}")
            severity = "high"
            confidence = 0.9

        # Rule 2: Sales down but footfall stable
        elif sales_down and footfall_stable:
            root_cause = "Lower spending per customer"
            evidence.append(f"Sales decreased by {abs(sales_change):.1f}% despite stable footfall ({footfall_change:+.1f}%)")
            evidence.append(f"Customers are visiting but buying less")
            severity = "medium"
            confidence = 0.85

        # Rule 4: Stock up and sales down -> Slow-moving inventory
        elif stock_up and sales_down:
            root_cause = "Slow-moving inventory"
            evidence.append(f"Stock value increased by {stock_change:.1f}% while sales decreased by {abs(sales_change):.1f}%")
            evidence.append(f"Products are not selling as expected")
            severity = "high"
            confidence = 0.85

        # Rule 3: Expenses up significantly
        elif expenses_up and sales_change < expense_change:
            root_cause = "Increasing operating expenses"
            evidence.append(f"Expenses increased by {expense_change:.1f}% while sales changed by {sales_change:+.1f}%")
            if avg_expense_ratio > 0:
                evidence.append(f"Current expense ratio: {avg_expense_ratio:.1f}%")
            severity = "high"
            confidence = 0.9

        # Rule 6: Revenue per customer declining
        elif sales_down and not footfall_down:
            root_cause = "Decreasing average transaction value"
            evidence.append(f"Sales decreased by {abs(sales_change):.1f}%")
            evidence.append(f"Footfall changed by {footfall_change:+.1f}%")
            if avg_revenue_per_customer > 0:
                evidence.append(f"Average revenue per customer: ₹{avg_revenue_per_customer:.0f}")
            severity = "medium"
            confidence = 0.8

        # Rule 5: Growth (positive)
        elif sales_up and footfall_up:
            root_cause = "Growing customer base"
            evidence.append(f"Sales increased by {sales_change:.1f}%")
            evidence.append(f"Customer visits increased by {footfall_change:.1f}%")
            severity = "low"
            confidence = 0.95

        # Rule 7: Sales up but footfall stable -> higher spending per customer
        elif sales_up and footfall_stable:
            root_cause = "Increasing average transaction value"
            evidence.append(f"Sales increased by {sales_change:.1f}% with stable footfall ({footfall_change:+.1f}%)")
            evidence.append(f"Customers are spending more per visit")
            severity = "low"
            confidence = 0.85

        # Default: add basic evidence
        if not evidence:
            evidence.append(f"Sales change: {sales_change:+.1f}%")
            evidence.append(f"Footfall change: {footfall_change:+.1f}%")
            evidence.append(f"Expense change: {expense_change:+.1f}%")

        return {
            "root_cause": root_cause,
            "evidence": evidence,
            "confidence": confidence,
            "severity": severity
        }

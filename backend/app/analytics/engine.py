import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class AnalyticsEngine:
    def __init__(self):
        pass

    def calculate_summary(self, metrics_list, current_days=30):
        if not metrics_list:
            return {}

        df = pd.DataFrame(metrics_list)
        df['date'] = pd.to_datetime(df['date']).dt.date
        df = df.sort_values('date')

        latest_date = df['date'].max()
        cutoff_date = latest_date - timedelta(days=current_days)

        current_df = df[df['date'] > cutoff_date]
        prev_df = df[(df['date'] <= cutoff_date) & (df['date'] > (cutoff_date - timedelta(days=current_days)))]

        def safe_sum(data, col):
            return float(data[col].sum()) if len(data) > 0 and col in data else 0.0

        curr_sales = safe_sum(current_df, 'sales')
        curr_expenses = safe_sum(current_df, 'expenses')
        curr_footfall = safe_sum(current_df, 'footfall')

        prev_sales = safe_sum(prev_df, 'sales')
        prev_expenses = safe_sum(prev_df, 'expenses')
        prev_footfall = safe_sum(prev_df, 'footfall')

        def calc_change(curr, prev):
            if prev == 0:
                return 100.0 if curr > 0 else 0.0
            return float(((curr - prev) / prev) * 100.0)

        # 7-day moving averages
        df['sales_ma_7'] = df['sales'].rolling(window=7, min_periods=1).mean()

        # Revenue per customer (per day)
        df['revenue_per_customer'] = np.where(df['footfall'] > 0, df['sales'] / df['footfall'], 0)

        # Expense ratio (per day)
        df['expense_ratio'] = np.where(df['sales'] > 0, (df['expenses'] / df['sales']) * 100, 0)

        # Averages for current period
        current_df_copy = current_df.copy()
        current_df_copy['revenue_per_customer'] = np.where(
            current_df_copy['footfall'] > 0,
            current_df_copy['sales'] / current_df_copy['footfall'],
            0
        )
        avg_revenue = float(current_df_copy['revenue_per_customer'].mean()) if len(current_df_copy) > 0 else 0.0

        avg_expense_ratio = float((curr_expenses / curr_sales) * 100) if curr_sales > 0 else 0.0

        # Trend data as array of objects for Recharts
        trend_data = df.tail(current_days).copy()
        trends = []
        for _, row in trend_data.iterrows():
            trends.append({
                "date": str(row['date']),
                "sales": round(float(row['sales']), 2),
                "expenses": round(float(row['expenses']), 2),
                "customer_footfall": int(row['footfall']),
                "stock_value": round(float(row.get('stock_value', 0)), 2),
                "sales_ma_7": round(float(row['sales_ma_7']), 2),
                "revenue_per_customer": round(float(row['revenue_per_customer']), 2),
                "expense_ratio": round(float(row['expense_ratio']), 1),
            })

        return {
            "current_period": {
                "sales": curr_sales,
                "expenses": curr_expenses,
                "footfall": curr_footfall
            },
            "previous_period": {
                "sales": prev_sales,
                "expenses": prev_expenses,
                "footfall": prev_footfall
            },
            "sales_change_pct": calc_change(curr_sales, prev_sales),
            "expense_change_pct": calc_change(curr_expenses, prev_expenses),
            "footfall_change_pct": calc_change(curr_footfall, prev_footfall),
            "avg_revenue_per_customer": avg_revenue,
            "avg_expense_ratio": avg_expense_ratio,
            "trends": trends
        }

    def detect_anomalies(self, metrics_list):
        df = pd.DataFrame(metrics_list)
        if len(df) < 7:
            return []

        anomalies = []
        for col in ['sales', 'footfall', 'expenses']:
            if col in df.columns:
                mean = df[col].mean()
                std = df[col].std()
                if std > 0:
                    df[f'{col}_zscore'] = (df[col] - mean) / std
                    anomalous = df[df[f'{col}_zscore'].abs() > 2.0]
                    for _, row in anomalous.iterrows():
                        anomalies.append({
                            "date": str(row['date']),
                            "metric": col,
                            "value": float(row[col]),
                            "type": "high" if row[f'{col}_zscore'] > 0 else "low"
                        })
        return anomalies

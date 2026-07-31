"""
House Price Prediction — Complete Data Cleaning Process

Takes the messy raw_house_data.csv (real-world-style issues: duplicates,
missing values, inconsistent text casing, currency-formatted strings,
negative/impossible values, price outliers) and produces a clean,
analysis-ready cleaned_house_data.csv, printing a report of every
step along the way.
"""

import os
import re
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(__file__)
RAW_PATH = os.path.join(BASE_DIR, "raw_house_data.csv")
CLEAN_PATH = os.path.join(BASE_DIR, "cleaned_house_data.csv")


def section(title):
    print(f"\n{'=' * 60}\n{title}\n{'=' * 60}")


def load_data():
    df = pd.read_csv(RAW_PATH)
    section("1. RAW DATA OVERVIEW")
    print(f"Shape: {df.shape}")
    print(df.dtypes)
    return df


def drop_duplicates(df):
    before = len(df)
    df = df.drop_duplicates(subset=[c for c in df.columns if c != "house_id"])
    section("2. DUPLICATES")
    print(f"Removed {before - len(df)} duplicate rows.")
    return df


def clean_city(df):
    df["city"] = df["city"].str.strip().str.title()
    return df


def clean_furnishing(df):
    df["furnishing"] = df["furnishing"].str.strip().str.title()
    df["furnishing"] = df["furnishing"].replace({"Semi-Furnished": "Semi-Furnished"})
    df["furnishing"] = df["furnishing"].fillna("Unknown")
    return df


def clean_price(df):
    def parse_price(value):
        if pd.isna(value):
            return np.nan
        if isinstance(value, (int, float)):
            return float(value)
        cleaned = re.sub(r"[^\d.]", "", str(value))
        return float(cleaned) if cleaned else np.nan

    df["price_lakhs"] = df["price_lakhs"].apply(parse_price)
    return df


def fix_negative_area(df):
    negative_mask = df["area_sqft"] < 0
    section("3. NEGATIVE / IMPOSSIBLE VALUES")
    print(f"Fixed {negative_mask.sum()} negative area_sqft values (took absolute value).")
    df.loc[negative_mask, "area_sqft"] = df.loc[negative_mask, "area_sqft"].abs()
    return df


def handle_missing(df):
    section("4. MISSING VALUES")
    print("Missing values before imputation:")
    print(df.isna().sum())

    df["area_sqft"] = df["area_sqft"].fillna(df["area_sqft"].median())
    df["bathrooms"] = df["bathrooms"].fillna(df["bathrooms"].median())
    df["age_years"] = df["age_years"].fillna(df["age_years"].median())
    df["price_lakhs"] = df["price_lakhs"].fillna(df["price_lakhs"].median())

    print("\nMissing values after imputation (median fill):")
    print(df.isna().sum())
    return df


def cap_outliers(df):
    section("5. OUTLIERS (price_lakhs)")
    q1, q3 = df["price_lakhs"].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    outliers = ((df["price_lakhs"] < lower) | (df["price_lakhs"] > upper)).sum()
    print(f"IQR bounds: [{lower:.2f}, {upper:.2f}] lakhs")
    print(f"Capped {outliers} outlier rows to the IQR bounds.")
    df["price_lakhs"] = df["price_lakhs"].clip(lower, upper)
    return df


def fix_dtypes(df):
    df["bedrooms"] = df["bedrooms"].astype(int)
    df["bathrooms"] = df["bathrooms"].round().astype(int)
    df["age_years"] = df["age_years"].round().astype(int)
    df["area_sqft"] = df["area_sqft"].round().astype(int)
    df["price_lakhs"] = df["price_lakhs"].round(2)
    return df


def main():
    df = load_data()
    df = drop_duplicates(df)
    df = clean_city(df)
    df = clean_furnishing(df)
    df = clean_price(df)
    df = fix_negative_area(df)
    df = handle_missing(df)
    df = cap_outliers(df)
    df = fix_dtypes(df)

    section("6. FINAL CLEAN DATA")
    print(f"Shape: {df.shape}")
    print(df.dtypes)
    print(df.head(10))

    df.to_csv(CLEAN_PATH, index=False)
    section("DONE")
    print(f"Cleaned data written to: {CLEAN_PATH}")


if __name__ == "__main__":
    main()

# data_pipeline.py
from datetime import datetime, timedelta
import pandas as pd
import matplotlib.pyplot as plt
import time
import multiprocessing as mp
import openmeteo_requests
import requests_cache
from retry_requests import retry

nasa_csv_path = '/Users/meghanagopu/Documents/GitHub/blazepath_app_repo/backend/Wildfire_data_2022-2025.csv'
nasa = pd. read_csv(nasa_csv_path)
weather_csv_path = '/Users/meghanagopu/Documents/GitHub/blazepath_app_repo/backend/long_lat_weather_data.csv'
weather = pd.read_csv()
#removed all duplicated
nasa[nasa.duplicated(subset=['acq_date', 'acq_time'])]
nasa.drop_duplicates(subset=['acq_date', 'acq_time'], inplace=True)
# Step 1: Convert date columns to consistent format
nasa['acq_date'] = pd.to_datetime(nasa['acq_date'], format='%m/%d/%y')
# Step 2: Convert time column to match weather format
nasa['acq_time'] = nasa['acq_time'].astype(str).str.zfill(4)  # Ensure leading zeros for hours < 10
nasa['acq_time'] = pd.to_datetime(nasa['acq_time'], format='%H%M').dt.time
#setting date time formate
nasa['acq_time'] = pd.to_datetime(nasa['acq_time'], format='%H:%M:%S')
# Round to the nearest hour
nasa['round_time'] = nasa['acq_time'].dt.round('H')
# Convert back to time format (HH:MM:SS)
nasa['round_time'] = nasa['round_time'].dt.time
nasa['acq_time'] = nasa['acq_time'].dt.time
#removing time component from date column
nasa['acq_date'] = pd.to_datetime(nasa['acq_date']).dt.date

# Step 3: Create new columns for date and time components
weather['date'] = pd.to_datetime(weather['date'])  # Convert 'date' column to datetime
weather['time'] = weather['date'].dt.time
weather['date'] = weather['date'].dt.date
# Moving the time column to the front for ease of visualization
col = weather.columns.to_list()
col.remove('time')
col.insert(1, 'time')
weather = weather[col]
weather.head()

#merge both sets and get training data and merge on date_time
nasa['date_time'] = pd.to_datetime(nasa['acq_date'].astype(str) + ' ' + nasa['round_time'].astype(str))
weather['date_time'] = pd.to_datetime(weather['date'].astype(str) + ' ' + weather['time'].astype(str))


# Merging on date_time to get positive samples
positive = pd.merge(nasa, weather, on='date_time', how='inner')


merged_df = pd.merge(weather, nasa, on='date_time', how='left', suffixes=('_weather', '_nasa'))


# Filter out rows where there was a match
matched_rows = merged_df.dropna(subset=['brightness'])


# Filter out rows where there was no match
unmatched_rows = merged_df[merged_df['brightness'].isna()]
merged_df.columns
unmatched = pd.merge(weather, nasa, on='date_time', how='left', indicator=True).query('_merge == "left_only"')
unmatched
weather['is_possible_ff'] = weather['date_time'].isin(nasa['date_time'].tolist())
weather['target'] = weather['is_possible_ff'].astype(int)
#create a csv
unmatched.to_csv('merged_data.csv')

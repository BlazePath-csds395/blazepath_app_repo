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

nasa



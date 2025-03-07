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
merge_csv_path = '/Users/meghanagopu/Documents/GitHub/blazepath_app_repo/backend/merged_data.csv'
merged_dataset = pd.read_csv()



# use the merged data from 
filtered_df= pd.DataFrame()
for index, row in merged_dataset.iterrows():
   if (row['longitude'] >= -121.8) and (row['longitude']<= -121.2) and (row['latitude']>= 37.1) and (row['latitude']<= 37.5):
       filtered_df=pd.concat([filtered_df, row.to_frame().T])


filtered_df=filtered_df.drop(['Unnamed: 0','acq_time'], axis=1)
filtered_df['date_time']=pd.to_datetime(filtered_df['acq_date'] + ' ' + filtered_df['round_time'])
filtered_df=filtered_df.sort_values('date_time')


#adding forest fire label for all positive sample
filtered_df['forest_fire']='Y'
#fetch weather for centroit from the openmateo data
new_df=filtered_df


#add weather data for missing timestampes in the filtered data
count=0


for index, row in weather.iterrows():
   if ((filtered_df['date_time'].eq(str(row['date_time'])).any()) == False):
       # pd.concat([new_df,row.to_frame().T], ignore_index = True)
       new_df=pd.concat([new_df, row.to_frame().T])
       print(index)
final_df=new_df.sort_values('date_time')
final_df.forest_fire=final_df.forest_fire.fillna('N')
final_df.head()
#create a csv this is the final dataset we can use for leaflet. 


# Read merged dataset containing all locations
merged_dataset = pd.read_csv('/content/drive/MyDrive/Capstone Visuals/long_lat_merged_v2.csv')

# Remove unnecessary columns and sort by date_time
filtered_df = merged_dataset.drop(['Unnamed: 0','acq_time'], axis=1)
filtered_df['date_time'] = pd.to_datetime(filtered_df['acq_date'] + ' ' + filtered_df['round_time'])
filtered_df = filtered_df.sort_values('date_time')

# Assign 'Y' to wildfire occurrences
filtered_df['forest_fire'] = 'Y'

# Fetch weather data for all locations
new_df = filtered_df

# Add missing timestamps with weather data (no fire cases)
for index, row in weather.iterrows():
    if not filtered_df['date_time'].eq(str(row['date_time'])).any():
        new_df = pd.concat([new_df, row.to_frame().T])

# Sort final dataset
final_df = new_df.sort_values('date_time')

# Fill missing values in the 'forest_fire' column as 'N' (No Wildfire)
final_df['forest_fire'] = final_df['forest_fire'].fillna('N')

# Save the final dataset
final_df.to_csv('/content/drive/MyDrive/Capstone Visuals/final_wildfire_dataset.csv', index=False)

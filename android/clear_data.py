import os

# Clear user data file
data_file = "user_data.json"
if os.path.exists(data_file):
    os.remove(data_file)
    print("Cleared user data file")
else:
    print("No user data file found")

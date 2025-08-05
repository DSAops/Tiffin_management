"""
Professional Tiffin Management System - Console Interface
A simple console version to test all functionality while Kivy installation is resolved
"""

import asyncio
import json
import sys
import os
from datetime import datetime, date
from storage import Storage
from api import APIClient

class TiffinApp:
    def __init__(self):
        self.storage = Storage()
        self.api = APIClient(self.storage)
        self.current_user = None
        
    def clear_screen(self):
        os.system('cls' if os.name == 'nt' else 'clear')
        
    def print_header(self, title):
        print("=" * 60)
        print(f"🍛 {title.center(54)} 🍛")
        print("=" * 60)
        
    def print_menu(self, options):
        print("\nPlease select an option:")
        for i, option in enumerate(options, 1):
            print(f"{i}. {option}")
        print("0. Exit")
        
    async def authenticate(self):
        """Handle user authentication"""
        self.clear_screen()
        self.print_header("TIFFIN MANAGEMENT - LOGIN")
        
        if self.storage.is_logged_in():
            user_data = self.storage.get_user_data()
            print(f"Welcome back, {user_data.get('name', 'User')}!")
            self.current_user = user_data
            return True
            
        while True:
            print("\n1. Login")
            print("2. Sign Up")
            print("0. Exit")
            
            choice = input("\nEnter your choice: ").strip()
            
            if choice == "0":
                return False
            elif choice == "1":
                if await self.login():
                    return True
            elif choice == "2":
                if await self.signup():
                    return True
            else:
                print("Invalid choice! Please try again.")
                
    async def login(self):
        """Login user"""
        print("\n--- LOGIN ---")
        email = input("Email: ").strip()
        password = input("Password: ").strip()
        
        if not email or not password:
            print("❌ Please enter both email and password!")
            return False
            
        print("Logging in...")
        result = await self.api.login({"email": email, "password": password})
        
        if "error" in result:
            print(f"❌ Login failed: {result['error']}")
            return False
            
        # Save user data
        user_data = {
            "id": result["user"]["id"],
            "name": result["user"]["name"],
            "email": result["user"]["email"]
        }
        self.storage.save_user_data(user_data, result["token"])
        self.current_user = user_data
        
        print("✅ Login successful!")
        return True
        
    async def signup(self):
        """Sign up new user"""
        print("\n--- SIGN UP ---")
        name = input("Full Name: ").strip()
        email = input("Email: ").strip()
        password = input("Password: ").strip()
        
        if not all([name, email, password]):
            print("❌ Please fill all fields!")
            return False
            
        print("Creating account...")
        result = await self.api.signup({
            "name": name,
            "email": email,
            "password": password
        })
        
        if "error" in result:
            print(f"❌ Signup failed: {result['error']}")
            return False
            
        # Save user data
        user_data = {
            "id": result["user"]["id"],
            "name": result["user"]["name"],
            "email": result["user"]["email"]
        }
        self.storage.save_user_data(user_data, result["token"])
        self.current_user = user_data
        
        print("✅ Account created successfully!")
        return True
        
    async def show_dashboard(self):
        """Display dashboard with stats"""
        self.clear_screen()
        self.print_header("DASHBOARD")
        
        print("Loading dashboard data...")
        stats = await self.api.get_dashboard_stats()
        
        if "error" in stats:
            print(f"❌ Error loading dashboard: {stats['error']}")
            return
            
        print(f"\n📊 Dashboard Statistics:")
        print(f"   Total Users: {stats.get('total_users', 0)}")
        print(f"   Active Schedules: {stats.get('active_schedules', 0)}")
        print(f"   Today's Deliveries: {stats.get('todays_deliveries', 0)}")
        print(f"   Completed Deliveries: {stats.get('completed_deliveries', 0)}")
        
        # Show recent deliveries
        deliveries = await self.api.get_my_deliveries(self.current_user["id"], 7)
        if "error" not in deliveries:
            print(f"\n📦 Your Recent Deliveries (Last 7 days):")
            if deliveries:
                for delivery in deliveries[:5]:  # Show last 5
                    status = "✅" if delivery.get("delivered") else "⏳"
                    date_str = delivery.get("delivery_date", "N/A")
                    print(f"   {status} {date_str} - {delivery.get('status', 'Pending')}")
            else:
                print("   No recent deliveries found.")
                
        input("\nPress Enter to continue...")
        
    async def show_my_schedule(self):
        """Display and manage user's tiffin schedule"""
        self.clear_screen()
        self.print_header("MY TIFFIN SCHEDULE")
        
        print("Loading your schedule...")
        schedule = await self.api.get_my_schedule(self.current_user["id"])
        
        if "error" in schedule:
            print(f"❌ Error loading schedule: {schedule['error']}")
            input("\nPress Enter to continue...")
            return
            
        print(f"\n📅 Weekly Schedule:")
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        weekly = schedule.get("weekly_schedule", {})
        
        for day in days:
            enabled = weekly.get(day.lower(), False)
            status = "✅ Enabled" if enabled else "❌ Disabled"
            print(f"   {day}: {status}")
            
        # Holiday mode info
        holiday_mode = schedule.get("holiday_mode", {})
        if holiday_mode.get("enabled"):
            print(f"\n🏖️ Holiday Mode: Active")
            print(f"   From: {holiday_mode.get('start_date', 'N/A')}")
            print(f"   To: {holiday_mode.get('end_date', 'N/A')}")
        else:
            print(f"\n🏖️ Holiday Mode: Inactive")
            
        print("\nOptions:")
        print("1. Update Weekly Schedule")
        print("2. Manage Holiday Mode")
        print("0. Back to Main Menu")
        
        choice = input("\nEnter your choice: ").strip()
        
        if choice == "1":
            await self.update_weekly_schedule(weekly)
        elif choice == "2":
            await self.manage_holiday_mode(holiday_mode)
            
    async def update_weekly_schedule(self, current_schedule):
        """Update weekly tiffin schedule"""
        print("\n--- UPDATE WEEKLY SCHEDULE ---")
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        new_schedule = current_schedule.copy()
        
        for day in days:
            current = new_schedule.get(day, False)
            status = "enabled" if current else "disabled"
            
            while True:
                choice = input(f"{day.capitalize()} (currently {status}) - Enable? (y/n/skip): ").strip().lower()
                if choice in ['y', 'yes']:
                    new_schedule[day] = True
                    break
                elif choice in ['n', 'no']:
                    new_schedule[day] = False
                    break
                elif choice in ['s', 'skip', '']:
                    break
                else:
                    print("Please enter y/n or skip")
                    
        print("\nUpdating schedule...")
        result = await self.api.update_schedule(self.current_user["id"], new_schedule)
        
        if "error" in result:
            print(f"❌ Error updating schedule: {result['error']}")
        else:
            print("✅ Schedule updated successfully!")
            
        input("\nPress Enter to continue...")
        
    async def manage_holiday_mode(self, current_holiday):
        """Manage holiday mode settings"""
        print("\n--- HOLIDAY MODE ---")
        
        if current_holiday.get("enabled"):
            print("Holiday mode is currently ACTIVE")
            choice = input("Disable holiday mode? (y/n): ").strip().lower()
            if choice in ['y', 'yes']:
                holiday_mode = {"enabled": False}
            else:
                return
        else:
            print("Holiday mode is currently INACTIVE")
            choice = input("Enable holiday mode? (y/n): ").strip().lower()
            if choice in ['y', 'yes']:
                start_date = input("Start date (YYYY-MM-DD): ").strip()
                end_date = input("End date (YYYY-MM-DD): ").strip()
                
                # Basic date validation
                try:
                    datetime.strptime(start_date, "%Y-%m-%d")
                    datetime.strptime(end_date, "%Y-%m-%d")
                    holiday_mode = {
                        "enabled": True,
                        "start_date": start_date,
                        "end_date": end_date
                    }
                except ValueError:
                    print("❌ Invalid date format! Please use YYYY-MM-DD")
                    input("\nPress Enter to continue...")
                    return
            else:
                return
                
        print("Updating holiday mode...")
        result = await self.api.update_schedule(
            self.current_user["id"], 
            {}, 
            holiday_mode
        )
        
        if "error" in result:
            print(f"❌ Error updating holiday mode: {result['error']}")
        else:
            print("✅ Holiday mode updated successfully!")
            
        input("\nPress Enter to continue...")
        
    async def main_menu(self):
        """Main application menu"""
        while True:
            self.clear_screen()
            self.print_header(f"WELCOME {self.current_user['name'].upper()}")
            
            options = [
                "View Dashboard",
                "My Tiffin Schedule", 
                "Logout"
            ]
            
            self.print_menu(options)
            choice = input("\nEnter your choice: ").strip()
            
            if choice == "0":
                print("Thank you for using Tiffin Management System!")
                break
            elif choice == "1":
                await self.show_dashboard()
            elif choice == "2":
                await self.show_my_schedule()
            elif choice == "3":
                self.storage.clear_user_data()
                print("✅ Logged out successfully!")
                break
            else:
                print("Invalid choice! Please try again.")
                input("\nPress Enter to continue...")
                
    async def run(self):
        """Main application runner"""
        try:
            self.clear_screen()
            self.print_header("PROFESSIONAL TIFFIN MANAGEMENT")
            print("🍛 Welcome to your personal tiffin delivery system!")
            print("📱 Console version - Full GUI coming soon!")
            
            if await self.authenticate():
                await self.main_menu()
                
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
        except Exception as e:
            print(f"\n❌ An error occurred: {e}")
            print("Please restart the application.")

def main():
    """Entry point"""
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    app = TiffinApp()
    asyncio.run(app.run())

if __name__ == "__main__":
    main()

import asyncio
import threading
from kivymd.uix.screen import MDScreen
from kivymd.uix.label import MDLabel
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.selectioncontrol import MDCheckbox
from kivymd.uix.textfield import MDTextField
from kivymd.uix.card import MDCard
from kivymd.toast import toast
from kivy.clock import Clock

class SettingsScreen(MDScreen):
    def on_pre_enter(self):
        self.clear_widgets()
        from kivy.app import App
        app = App.get_running_app()
        
        name, email, user_id = app.storage.get_user()
        
        # Create main layout
        self.main_layout = MDBoxLayout(orientation="vertical", spacing=20, padding=20)
        self.main_layout.add_widget(MDLabel(
            text=f"Tiffin Settings for {name}", 
            halign="center", 
            font_style="H5"
        ))
        
        # Back button
        back_btn = MDRaisedButton(text="← Back to Dashboard", size_hint_y=None, height=40)
        back_btn.bind(on_release=lambda x: setattr(self.manager, 'current', 'dashboard'))
        self.main_layout.add_widget(back_btn)
        
        # Settings card
        self.settings_card = MDCard(orientation="vertical", padding=20, spacing=15)
        self.settings_card.add_widget(MDLabel(
            text="Weekly Tiffin Schedule", 
            font_style="H6", 
            halign="center"
        ))
        self.settings_card.add_widget(MDLabel(
            text="Select which days you want tiffin and at what time:", 
            halign="center"
        ))
        
        # Day controls
        self.day_controls = {}
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        
        for day in days:
            day_layout = MDBoxLayout(orientation="horizontal", spacing=10, size_hint_y=None, height=50)
            
            # Checkbox
            checkbox = MDCheckbox(size_hint_x=0.1)
            self.day_controls[day] = {"checkbox": checkbox}
            
            # Day label
            day_label = MDLabel(text=day.title(), size_hint_x=0.4)
            
            # Time input
            time_input = MDTextField(
                hint_text="12:00", 
                size_hint_x=0.5,
                helper_text="Format: HH:MM (24-hour)"
            )
            self.day_controls[day]["time"] = time_input
            
            day_layout.add_widget(checkbox)
            day_layout.add_widget(day_label)
            day_layout.add_widget(time_input)
            
            self.settings_card.add_widget(day_layout)
        
        # Save button
        save_btn = MDRaisedButton(text="Save Schedule", size_hint_y=None, height=50)
        save_btn.bind(on_release=self.save_schedule)
        self.settings_card.add_widget(save_btn)
        
        self.main_layout.add_widget(self.settings_card)
        
        # Loading message
        self.loading_label = MDLabel(text="Loading your current schedule...", halign="center")
        self.main_layout.add_widget(self.loading_label)
        
        self.add_widget(self.main_layout)
        
        # Load current schedule
        self.load_current_schedule()

    def load_current_schedule(self):
        from kivy.app import App
        app = App.get_running_app()
        name, email, user_id = app.storage.get_user()
        
        def load_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def fetch_schedule():
                try:
                    print("[DEBUG] Fetching user schedule...")
                    resp = await app.api.get_my_schedule(user_id)
                    print(f"[DEBUG] Schedule response: {resp}")
                    
                    def update_ui():
                        self.loading_label.text = ""
                        
                        if resp.get("error"):
                            toast(f"Error loading schedule: {resp['error']}")
                            return
                        
                        # Populate form with current schedule
                        weekly_schedule = resp.get("weekly_schedule", {})
                        for day, controls in self.day_controls.items():
                            day_data = weekly_schedule.get(day, {})
                            controls["checkbox"].active = day_data.get("enabled", False)
                            controls["time"].text = day_data.get("time", "12:00")
                    
                    Clock.schedule_once(lambda dt: update_ui())
                    
                except Exception as e:
                    print(f"[DEBUG] Load schedule error: {e}")
                    Clock.schedule_once(lambda dt: toast(f"Error: {e}"))
            
            loop.run_until_complete(fetch_schedule())
            loop.close()
        
        threading.Thread(target=load_thread, daemon=True).start()

    def save_schedule(self, *args):
        from kivy.app import App
        app = App.get_running_app()
        name, email, user_id = app.storage.get_user()
        
        # Collect form data
        weekly_schedule = {}
        for day, controls in self.day_controls.items():
            time_text = controls["time"].text.strip() or "12:00"
            
            # Basic time validation
            try:
                hour, minute = time_text.split(":")
                hour = int(hour)
                minute = int(minute)
                if not (0 <= hour <= 23 and 0 <= minute <= 59):
                    raise ValueError("Invalid time range")
                time_text = f"{hour:02d}:{minute:02d}"
            except:
                toast(f"Invalid time format for {day.title()}. Use HH:MM format.")
                return
            
            weekly_schedule[day] = {
                "enabled": controls["checkbox"].active,
                "time": time_text
            }
        
        print(f"[DEBUG] Saving schedule: {weekly_schedule}")
        
        def save_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def save():
                try:
                    print("[DEBUG] Sending schedule update...")
                    resp = await app.api.update_schedule(user_id, weekly_schedule)
                    print(f"[DEBUG] Save response: {resp}")
                    
                    def update_ui():
                        if resp.get("message"):
                            toast("Schedule saved successfully!")
                        elif resp.get("error"):
                            toast(f"Error saving schedule: {resp['error']}")
                        else:
                            toast("Schedule saved!")
                    
                    Clock.schedule_once(lambda dt: update_ui())
                    
                except Exception as e:
                    print(f"[DEBUG] Save schedule error: {e}")
                    Clock.schedule_once(lambda dt: toast(f"Error: {e}"))
            
            loop.run_until_complete(save())
            loop.close()
        
        threading.Thread(target=save_thread, daemon=True).start()

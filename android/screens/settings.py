import asyncio
import threading
from datetime import datetime, timedelta
from kivymd.uix.screen import MDScreen
from kivymd.uix.card import MDCard
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.gridlayout import MDGridLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.button import MDRaisedButton, MDIconButton, MDFlatButton
from kivymd.uix.textfield import MDTextField
from kivymd.uix.selectioncontrol import MDCheckbox, MDSwitch
from kivymd.uix.dialog import MDDialog
from kivymd.toast import toast
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.slider import MDSlider
from kivy.clock import Clock
from kivy.metrics import dp

class SettingsScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_schedule = {}
        self.holiday_mode = {}
        self.storage = None
        self.api = None
        
        # Build UI first
        self.build_ui()
        
        # Load data after screen is ready
        Clock.schedule_once(self.load_initial_data, 0.5)
    
    def load_initial_data(self, dt):
        """Load initial data after screen is ready"""
        try:
            from kivy.app import App
            app = App.get_running_app()
            if app:
                self.storage = app.storage
                self.api = app.api
                
                # Load user data in a thread to avoid blocking UI
                threading.Thread(target=self.load_user_schedule, daemon=True).start()
        except Exception as e:
            print(f"Error loading initial data: {e}")
    
    def load_user_schedule(self):
        """Load user schedule in background thread"""
        if not self.storage or not self.api:
            return
            
        try:
            user_data = self.storage.get_user_data()
            if user_data:
                # Schedule UI update on main thread
                Clock.schedule_once(lambda dt: self.update_user_info(user_data), 0)
        except Exception as e:
            print(f"Error loading user schedule: {e}")
    
    def update_user_info(self, user_data):
        """Update UI with user information"""
        try:
            # Find and update user info labels
            for child in self.walk():
                if hasattr(child, 'text') and 'User ID:' in str(getattr(child, 'text', '')):
                    child.text = f"User ID: {user_data.get('id', 'N/A')[:8]}..."
                elif hasattr(child, 'text') and 'Email:' in str(getattr(child, 'text', '')):
                    child.text = f"Email: {user_data.get('email', 'N/A')}"
        except Exception as e:
            print(f"Error updating user info: {e}")

    def build_ui(self):
        # Main layout
        main_layout = MDBoxLayout(
            orientation="vertical",
            spacing=0,
            md_bg_color=self.theme_cls.bg_light
        )
        
        # Top app bar
        top_bar = MDCard(
            MDBoxLayout(
                MDIconButton(
                    icon="arrow-left",
                    theme_icon_color="Primary",
                    size_hint_x=None,
                    width=dp(48),
                    on_release=lambda x: setattr(self.manager, 'current', 'dashboard')
                ),
                MDLabel(
                    text="⚙️ Tiffin Settings",
                    font_style="H6",
                    theme_text_color="Primary",
                    size_hint_x=0.8
                ),
                MDIconButton(
                    icon="content-save",
                    theme_icon_color="Primary",
                    size_hint_x=None,
                    width=dp(48),
                    on_release=self.save_all_settings
                ),
                orientation="horizontal",
                padding=[dp(20), dp(15)],
                spacing=dp(10)
            ),
            size_hint_y=None,
            height=dp(80),
            elevation=2,
            md_bg_color=self.theme_cls.primary_color,
            radius=[0, 0, 0, 0]
        )
        
        # Scrollable content
        scroll = MDScrollView()
        content_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20),
            padding=dp(20),
            size_hint_y=None
        )
        content_layout.bind(minimum_height=content_layout.setter('height'))
        
        # User info section
        user_info_card = self.create_user_info_section()
        content_layout.add_widget(user_info_card)
        
        # Weekly schedule section
        schedule_card = self.create_schedule_section()
        content_layout.add_widget(schedule_card)
        
        # Holiday mode section
        holiday_card = self.create_holiday_section()
        content_layout.add_widget(holiday_card)
        
        # Quick actions section
        actions_card = self.create_actions_section()
        content_layout.add_widget(actions_card)
        
        scroll.add_widget(content_layout)
        
        # Add to main layout
        main_layout.add_widget(top_bar)
        main_layout.add_widget(scroll)
        
        self.add_widget(main_layout)

    def create_user_info_section(self):
        """Create user info section"""
        # Create placeholder user info that will be updated later
        name = "Loading..."
        email = "Loading..."
        user_id = "Loading..."
        
        card = MDCard(
            elevation=2,
            padding=dp(20),
            size_hint_y=None,
            height=dp(140)
        )
        
        layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(10)
        )
        
        layout.add_widget(MDLabel(
            text="👤 Account Information",
            font_style="H6",
            theme_text_color="Primary",
            size_hint_y=None,
            height=dp(30)
        ))
        
        layout.add_widget(MDLabel(
            text=f"Name: {name or 'Not available'}",
            theme_text_color="Secondary"
        ))
        
        layout.add_widget(MDLabel(
            text=f"Email: {email or 'Not available'}",
            theme_text_color="Secondary"
        ))
        
        layout.add_widget(MDLabel(
            text=f"User ID: {user_id[:8] if user_id else 'Not available'}...",
            font_style="Caption",
            theme_text_color="Hint"
        ))
        
        card.add_widget(layout)
        return card

    def create_schedule_section(self):
        """Create weekly schedule section"""
        card = MDCard(
            elevation=2,
            padding=dp(20),
            size_hint_y=None,
            height=dp(480)
        )
        
        layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(15)
        )
        
        layout.add_widget(MDLabel(
            text="📅 Weekly Tiffin Schedule",
            font_style="H6",
            theme_text_color="Primary",
            size_hint_y=None,
            height=dp(30)
        ))
        
        layout.add_widget(MDLabel(
            text="Set which days you want tiffin delivery and at what time:",
            theme_text_color="Secondary",
            size_hint_y=None,
            height=dp(25)
        ))
        
        # Day controls
        self.day_controls = {}
        days = [
            ("monday", "Monday"),
            ("tuesday", "Tuesday"), 
            ("wednesday", "Wednesday"),
            ("thursday", "Thursday"),
            ("friday", "Friday"),
            ("saturday", "Saturday"),
            ("sunday", "Sunday")
        ]
        
        for day_key, day_name in days:
            day_card = MDCard(
                elevation=1,
                padding=dp(15),
                size_hint_y=None,
                height=dp(80),
                md_bg_color=self.theme_cls.bg_normal
            )
            
            day_layout = MDBoxLayout(
                orientation="horizontal",
                spacing=dp(15)
            )
            
            # Day info
            info_layout = MDBoxLayout(
                orientation="vertical",
                size_hint_x=0.4
            )
            
            info_layout.add_widget(MDLabel(
                text=day_name,
                font_style="Subtitle1",
                theme_text_color="Primary"
            ))
            
            # Enable switch
            switch = MDSwitch(
                size_hint_x=None,
                width=dp(60)
            )
            
            # Time input
            time_input = MDTextField(
                hint_text="12:00",
                helper_text="24-hour format (HH:MM)",
                size_hint_x=0.3,
                text="12:00"
            )
            
            self.day_controls[day_key] = {
                "switch": switch,
                "time": time_input
            }
            
            day_layout.add_widget(info_layout)
            day_layout.add_widget(switch)
            day_layout.add_widget(time_input)
            
            day_card.add_widget(day_layout)
            layout.add_widget(day_card)
        
        card.add_widget(layout)
        return card

    def create_holiday_section(self):
        """Create holiday mode section"""
        card = MDCard(
            elevation=2,
            padding=dp(20),
            size_hint_y=None,
            height=dp(220)
        )
        
        layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(15)
        )
        
        layout.add_widget(MDLabel(
            text="🏖️ Holiday Mode",
            font_style="H6",
            theme_text_color="Primary",
            size_hint_y=None,
            height=dp(30)
        ))
        
        layout.add_widget(MDLabel(
            text="Pause your tiffin deliveries during holidays or breaks:",
            theme_text_color="Secondary",
            size_hint_y=None,
            height=dp(25)
        ))
        
        # Holiday toggle
        holiday_layout = MDBoxLayout(
            orientation="horizontal",
            spacing=dp(15),
            size_hint_y=None,
            height=dp(50)
        )
        
        self.holiday_switch = MDSwitch()
        
        holiday_layout.add_widget(MDLabel(
            text="Enable Holiday Mode",
            size_hint_x=0.7
        ))
        holiday_layout.add_widget(self.holiday_switch)
        
        # Date inputs
        date_layout = MDBoxLayout(
            orientation="horizontal",
            spacing=dp(15),
            size_hint_y=None,
            height=dp(60)
        )
        
        self.holiday_start = MDTextField(
            hint_text="Start Date",
            helper_text="YYYY-MM-DD",
            size_hint_x=0.5
        )
        
        self.holiday_end = MDTextField(
            hint_text="End Date", 
            helper_text="YYYY-MM-DD",
            size_hint_x=0.5
        )
        
        date_layout.add_widget(self.holiday_start)
        date_layout.add_widget(self.holiday_end)
        
        layout.add_widget(holiday_layout)
        layout.add_widget(date_layout)
        
        card.add_widget(layout)
        return card

    def create_actions_section(self):
        """Create actions section"""
        card = MDCard(
            elevation=2,
            padding=dp(20),
            size_hint_y=None,
            height=dp(120)
        )
        
        layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(15)
        )
        
        layout.add_widget(MDLabel(
            text="🎯 Quick Actions",
            font_style="H6",
            theme_text_color="Primary",
            size_hint_y=None,
            height=dp(30)
        ))
        
        buttons_layout = MDBoxLayout(
            orientation="horizontal",
            spacing=dp(15),
            size_hint_y=None,
            height=dp(50)
        )
        
        save_btn = MDRaisedButton(
            text="SAVE ALL",
            size_hint_x=0.33,
            md_bg_color=self.theme_cls.primary_color
        )
        save_btn.bind(on_release=self.save_all_settings)
        
        reset_btn = MDFlatButton(
            text="RESET",
            size_hint_x=0.33
        )
        reset_btn.bind(on_release=self.reset_settings)
        
        preview_btn = MDFlatButton(
            text="PREVIEW",
            size_hint_x=0.33
        )
        preview_btn.bind(on_release=self.preview_schedule)
        
        buttons_layout.add_widget(save_btn)
        buttons_layout.add_widget(reset_btn)
        buttons_layout.add_widget(preview_btn)
        
        layout.add_widget(buttons_layout)
        
        card.add_widget(layout)
        return card

    def on_pre_enter(self):
        """Load current settings when screen is entered"""
        self.load_current_settings()

    def load_current_settings(self):
        """Load user's current settings"""
        from kivy.app import App
        app = App.get_running_app()
        name, email, user_id = app.storage.get_user()
        
        def load_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def fetch_settings():
                try:
                    resp = await app.api.get_my_schedule(user_id)
                    
                    def update_ui():
                        if resp.get("error"):
                            toast(f"Failed to load settings: {resp['error']}")
                            return
                        
                        # Populate schedule settings
                        weekly_schedule = resp.get("weekly_schedule", {})
                        for day, controls in self.day_controls.items():
                            day_data = weekly_schedule.get(day, {})
                            controls["switch"].active = day_data.get("enabled", False)
                            controls["time"].text = day_data.get("time", "12:00")
                        
                        toast("Settings loaded successfully")
                    
                    Clock.schedule_once(lambda dt: update_ui())
                    
                except Exception as e:
                    Clock.schedule_once(lambda dt: toast(f"Error loading settings: {e}"))
            
            loop.run_until_complete(fetch_settings())
            loop.close()
        
        threading.Thread(target=load_thread, daemon=True).start()

    def save_all_settings(self, *args):
        """Save all settings"""
        from kivy.app import App
        app = App.get_running_app()
        name, email, user_id = app.storage.get_user()
        
        # Validate and collect schedule data
        weekly_schedule = {}
        for day, controls in self.day_controls.items():
            time_text = controls["time"].text.strip() or "12:00"
            
            # Validate time format
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
                "enabled": controls["switch"].active,
                "time": time_text
            }
        
        # TODO: Implement holiday mode save logic
        # For now, just save the schedule
        
        def save_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def save():
                try:
                    resp = await app.api.update_schedule(user_id, weekly_schedule)
                    
                    def update_ui():
                        if resp.get("error"):
                            toast(f"Failed to save: {resp['error']}")
                        else:
                            toast("Settings saved successfully! 🎉")
                    
                    Clock.schedule_once(lambda dt: update_ui())
                    
                except Exception as e:
                    Clock.schedule_once(lambda dt: toast(f"Error saving: {e}"))
            
            loop.run_until_complete(save())
            loop.close()
        
        threading.Thread(target=save_thread, daemon=True).start()

    def reset_settings(self, *args):
        """Reset settings to default"""
        def confirm_reset(instance):
            # Reset to default values
            for day, controls in self.day_controls.items():
                if day == "sunday":
                    controls["switch"].active = True
                    controls["time"].text = "13:00"
                else:
                    controls["switch"].active = False
                    controls["time"].text = "12:00"
            
            self.holiday_switch.active = False
            self.holiday_start.text = ""
            self.holiday_end.text = ""
            
            toast("Settings reset to defaults")
            self.dialog.dismiss()
        
        def cancel_reset(instance):
            self.dialog.dismiss()
        
        self.dialog = MDDialog(
            title="Reset Settings",
            text="Are you sure you want to reset all settings to defaults?",
            buttons=[
                MDFlatButton(
                    text="CANCEL",
                    on_release=cancel_reset
                ),
                MDRaisedButton(
                    text="RESET",
                    on_release=confirm_reset
                ),
            ],
        )
        self.dialog.open()

    def preview_schedule(self, *args):
        """Preview the current schedule"""
        schedule_text = "📅 Your Weekly Schedule:\n\n"
        
        active_days = []
        for day, controls in self.day_controls.items():
            if controls["switch"].active:
                time = controls["time"].text or "12:00"
                active_days.append(f"• {day.title()}: {time}")
        
        if active_days:
            schedule_text += "\n".join(active_days)
        else:
            schedule_text += "No days selected for tiffin delivery."
        
        if self.holiday_switch.active:
            start = self.holiday_start.text.strip()
            end = self.holiday_end.text.strip()
            if start and end:
                schedule_text += f"\n\n🏖️ Holiday Mode: {start} to {end}"
        
        def close_preview(instance):
            self.dialog.dismiss()
        
        self.dialog = MDDialog(
            title="Schedule Preview",
            text=schedule_text,
            buttons=[
                MDRaisedButton(
                    text="OK",
                    on_release=close_preview
                ),
            ],
        )
        self.dialog.open()

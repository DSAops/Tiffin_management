import asyncio
import threading
from kivymd.uix.screen import MDScreen
from kivymd.uix.label import MDLabel
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.card import MDCard
from kivymd.uix.button import MDRaisedButton
from kivymd.toast import toast
from kivy.clock import Clock

class DashboardScreen(MDScreen):
    def on_pre_enter(self):
        self.clear_widgets()
        from kivy.app import App
        app = App.get_running_app()
        
        name, email, user_id = app.storage.get_user()
        
        # Create basic layout first
        self.main_layout = MDBoxLayout(orientation="vertical", spacing=20, padding=20)
        self.main_layout.add_widget(MDLabel(
            text=f"Welcome, {name}!", 
            halign="center", 
            font_style="H5"
        ))
        self.main_layout.add_widget(MDLabel(
            text="Tiffin Dashboard", 
            halign="center", 
            font_style="H6"
        ))
        
        # Navigation buttons
        nav_layout = MDBoxLayout(orientation="horizontal", spacing=10, size_hint_y=None, height=50)
        
        settings_btn = MDRaisedButton(text="Tiffin Settings", size_hint_x=0.5)
        settings_btn.bind(on_release=lambda x: setattr(self.manager, 'current', 'settings'))
        
        refresh_btn = MDRaisedButton(text="Refresh", size_hint_x=0.5)
        refresh_btn.bind(on_release=lambda x: self.load_dashboard_data())
        
        nav_layout.add_widget(settings_btn)
        nav_layout.add_widget(refresh_btn)
        self.main_layout.add_widget(nav_layout)
        
        # Content area
        self.content_layout = MDBoxLayout(orientation="vertical", spacing=10)
        self.content_layout.add_widget(MDLabel(text="Loading dashboard...", halign="center"))
        self.main_layout.add_widget(self.content_layout)
        
        self.add_widget(self.main_layout)
        
        # Load data
        self.load_dashboard_data()

    def load_dashboard_data(self):
        from kivy.app import App
        app = App.get_running_app()
        
        def load_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def fetch_data():
                try:
                    print("[DEBUG] Fetching dashboard stats...")
                    resp = await app.api.get_dashboard_stats()
                    print(f"[DEBUG] Dashboard response: {resp}")
                    
                    def update_ui():
                        self.content_layout.clear_widgets()
                        
                        if resp.get("error"):
                            self.content_layout.add_widget(MDLabel(
                                text=f"Error: {resp['error']}", 
                                halign="center"
                            ))
                            return
                        
                        # Stats summary
                        stats_card = MDCard(
                            orientation="vertical", 
                            padding=15, 
                            size_hint_y=None, 
                            height=120
                        )
                        stats_card.add_widget(MDLabel(
                            text="Tiffin Stats", 
                            font_style="H6", 
                            halign="center"
                        ))
                        stats_card.add_widget(MDLabel(
                            text=f"Total Users: {resp.get('total_users', 0)}", 
                            halign="center"
                        ))
                        stats_card.add_widget(MDLabel(
                            text=f"Today: {resp.get('today_delivered', 0)}/{resp.get('today_scheduled', 0)} delivered", 
                            halign="center"
                        ))
                        stats_card.add_widget(MDLabel(
                            text=f"This Week: {resp.get('week_delivered', 0)}/{resp.get('week_total', 0)} delivered", 
                            halign="center"
                        ))
                        self.content_layout.add_widget(stats_card)
                        
                        # User schedules
                        schedules = resp.get("schedules", [])
                        if schedules:
                            self.content_layout.add_widget(MDLabel(
                                text="Everyone's Tiffin Schedule:", 
                                font_style="Subtitle1", 
                                halign="center"
                            ))
                            
                            for schedule in schedules:
                                user_card = MDCard(
                                    orientation="vertical", 
                                    padding=10, 
                                    size_hint_y=None, 
                                    height=200
                                )
                                user_card.add_widget(MDLabel(
                                    text=schedule.get("user_name", "Unknown"), 
                                    font_style="Subtitle1", 
                                    halign="center"
                                ))
                                
                                # Show weekly schedule
                                weekly = schedule.get("weekly_schedule", {})
                                for day, details in weekly.items():
                                    if details.get("enabled", False):
                                        user_card.add_widget(MDLabel(
                                            text=f"{day.title()}: {details.get('time', 'N/A')}", 
                                            halign="center"
                                        ))
                                
                                self.content_layout.add_widget(user_card)
                        else:
                            self.content_layout.add_widget(MDLabel(
                                text="No schedules found", 
                                halign="center"
                            ))
                    
                    Clock.schedule_once(lambda dt: update_ui())
                    
                except Exception as e:
                    print(f"[DEBUG] Dashboard error: {e}")
                    def show_error():
                        self.content_layout.clear_widgets()
                        self.content_layout.add_widget(MDLabel(
                            text=f"Error loading dashboard: {e}", 
                            halign="center"
                        ))
                    Clock.schedule_once(lambda dt: show_error())
            
            loop.run_until_complete(fetch_data())
            loop.close()
        
        threading.Thread(target=load_thread, daemon=True).start()

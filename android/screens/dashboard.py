import asyncio
import threading
from datetime import datetime, timedelta
from kivymd.uix.screen import MDScreen
from kivymd.uix.card import MDCard
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.gridlayout import MDGridLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.button import MDRaisedButton, MDIconButton, MDFlatButton
from kivymd.uix.dialog import MDDialog
from kivymd.toast import toast
from kivymd.uix.tab import MDTabs, MDTabsBase
from kivymd.uix.floatlayout import MDFloatLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.progressbar import MDProgressBar
from kivy.clock import Clock
from kivy.metrics import dp

class Tab(MDFloatLayout, MDTabsBase):
    pass

class DashboardScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.storage = None
        self.api = None
        
        # Build UI first, load data later
        self.build_ui()
        
        # Schedule data loading after screen is ready
        Clock.schedule_once(self.load_initial_data, 0.5)
    
    def load_initial_data(self, dt):
        """Load initial data after screen is ready"""
        try:
            from kivy.app import App
            app = App.get_running_app()
            if app:
                self.storage = app.storage
                self.api = app.api
                
                # Load dashboard data in background thread
                threading.Thread(target=self.refresh_dashboard_data, daemon=True).start()
        except Exception as e:
            print(f"Error loading initial data: {e}")
    
    def refresh_dashboard_data(self):
        """Refresh dashboard data in background thread"""
        if not self.api:
            return
            
        try:
            # This will be implemented later when we have actual data
            pass
        except Exception as e:
            print(f"Error refreshing dashboard: {e}")

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
                MDLabel(
                    text="🍱 Tiffin Dashboard",
                    font_style="H6",
                    theme_text_color="Primary",
                    size_hint_x=0.7
                ),
                MDIconButton(
                    icon="cog",
                    theme_icon_color="Primary",
                    size_hint_x=None,
                    width=dp(48),
                    on_release=lambda x: setattr(self.manager, 'current', 'settings')
                ),
                MDIconButton(
                    icon="logout",
                    theme_icon_color="Primary", 
                    size_hint_x=None,
                    width=dp(48),
                    on_release=self.logout
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
        
        # Tabs
        self.tabs = MDTabs(
            background_color=self.theme_cls.primary_color,
            indicator_color=self.theme_cls.accent_color,
            text_color_active=self.theme_cls.accent_color,
            text_color_normal=self.theme_cls.primary_light
        )
        
        # Overview tab
        overview_tab = Tab(title="Overview")
        self.overview_content = MDScrollView()
        overview_tab.add_widget(self.overview_content)
        
        # My Tiffin tab
        my_tiffin_tab = Tab(title="My Tiffin")
        self.my_tiffin_content = MDScrollView()
        my_tiffin_tab.add_widget(self.my_tiffin_content)
        
        # Everyone tab
        everyone_tab = Tab(title="Everyone")
        self.everyone_content = MDScrollView()
        everyone_tab.add_widget(self.everyone_content)
        
        self.tabs.add_widget(overview_tab)
        self.tabs.add_widget(my_tiffin_tab)
        self.tabs.add_widget(everyone_tab)
        
        # Add to main layout
        main_layout.add_widget(top_bar)
        main_layout.add_widget(self.tabs)
        
        self.add_widget(main_layout)

    def on_pre_enter(self):
        """Load data when screen is entered"""
        self.load_dashboard_data()

    def load_dashboard_data(self):
        """Load all dashboard data"""
        from kivy.app import App
        app = App.get_running_app()
        
        # Show loading state
        self.show_loading_state()
        
        def load_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def fetch_data():
                try:
                    # Get dashboard stats
                    stats_resp = await app.api.get_dashboard_stats()
                    
                    # Get user info
                    user_data = app.storage.get_user_data()
                    name = user_data.get("name", "User")
                    email = user_data.get("email", "")
                    user_id = user_data.get("id", "")
                    
                    # Get user's personal schedule and deliveries
                    schedule_resp = await app.api.get_my_schedule(user_id)
                    deliveries_resp = await app.api.get_my_deliveries(user_id, 30)
                    
                    def update_ui():
                        self.populate_overview_tab(stats_resp, name)
                        self.populate_my_tiffin_tab(schedule_resp, deliveries_resp, name)
                        self.populate_everyone_tab(stats_resp.get('schedules', []))
                    
                    Clock.schedule_once(lambda dt: update_ui())
                    
                except Exception as e:
                    Clock.schedule_once(lambda dt: self.show_error_state(str(e)))
            
            loop.run_until_complete(fetch_data())
            loop.close()
        
        threading.Thread(target=load_thread, daemon=True).start()

    def show_loading_state(self):
        """Show loading indicators"""
        loading_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20),
            padding=dp(40)
        )
        
        loading_layout.add_widget(MDLabel(
            text="Loading dashboard...",
            halign="center",
            theme_text_color="Secondary"
        ))
        
        loading_layout.add_widget(MDProgressBar())
        
        self.overview_content.clear_widgets()
        self.my_tiffin_content.clear_widgets()
        self.everyone_content.clear_widgets()
        
        self.overview_content.add_widget(loading_layout)

    def show_error_state(self, error_msg):
        """Show error state"""
        error_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20),
            padding=dp(40)
        )
        
        error_layout.add_widget(MDLabel(
            text="😞",
            font_size=dp(48),
            halign="center"
        ))
        
        error_layout.add_widget(MDLabel(
            text="Failed to load dashboard",
            font_style="H6",
            halign="center",
            theme_text_color="Primary"
        ))
        
        error_layout.add_widget(MDLabel(
            text=str(error_msg),
            halign="center",
            theme_text_color="Secondary"
        ))
        
        retry_btn = MDRaisedButton(
            text="RETRY",
            size_hint=(None, None),
            height=dp(40),
            width=dp(120),
            pos_hint={"center_x": 0.5}
        )
        retry_btn.bind(on_release=lambda x: self.load_dashboard_data())
        error_layout.add_widget(retry_btn)
        
        self.overview_content.clear_widgets()
        self.overview_content.add_widget(error_layout)

    def populate_overview_tab(self, stats, user_name):
        """Populate overview tab with stats"""
        layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20),
            padding=dp(20)
        )
        
        # Welcome card
        welcome_card = MDCard(
            MDBoxLayout(
                MDLabel(
                    text=f"Welcome back, {user_name}! 👋",
                    font_style="H6",
                    theme_text_color="Primary"
                ),
                MDLabel(
                    text=f"Today is {datetime.now().strftime('%A, %B %d')}",
                    theme_text_color="Secondary"
                ),
                orientation="vertical",
                spacing=dp(5),
                padding=dp(20)
            ),
            elevation=2,
            size_hint_y=None,
            height=dp(100)
        )
        
        # Stats grid
        stats_card = MDCard(
            elevation=2,
            size_hint_y=None,
            height=dp(180),
            padding=dp(20)
        )
        
        stats_grid = MDGridLayout(
            cols=2,
            spacing=dp(20),
            size_hint_y=None,
            height=dp(140)
        )
        
        # Today's stats
        today_card = self.create_stat_card(
            "Today's Tiffins",
            f"{stats.get('today_delivered', 0)}/{stats.get('today_scheduled', 0)}",
            "📅",
            self.theme_cls.primary_color
        )
        
        # Weekly stats
        week_card = self.create_stat_card(
            "This Week",
            f"{stats.get('week_delivered', 0)}/{stats.get('week_total', 0)}",
            "📊",
            self.theme_cls.accent_color
        )
        
        # Total users
        users_card = self.create_stat_card(
            "Total Users",
            str(stats.get('total_users', 0)),
            "👥",
            self.theme_cls.primary_dark
        )
        
        # Success rate
        total = stats.get('week_total', 1)
        delivered = stats.get('week_delivered', 0)
        success_rate = int((delivered / total) * 100) if total > 0 else 0
        
        rate_card = self.create_stat_card(
            "Success Rate",
            f"{success_rate}%",
            "🎯",
            self.theme_cls.accent_dark
        )
        
        stats_grid.add_widget(today_card)
        stats_grid.add_widget(week_card)
        stats_grid.add_widget(users_card)
        stats_grid.add_widget(rate_card)
        
        stats_card.add_widget(stats_grid)
        
        # Quick actions
        actions_card = MDCard(
            MDBoxLayout(
                MDLabel(
                    text="Quick Actions",
                    font_style="Subtitle1",
                    theme_text_color="Primary",
                    size_hint_y=None,
                    height=dp(30)
                ),
                MDBoxLayout(
                    MDRaisedButton(
                        text="MY SCHEDULE",
                        size_hint_x=0.5,
                        on_release=lambda x: setattr(self.manager, 'current', 'settings')
                    ),
                    MDFlatButton(
                        text="REFRESH",
                        size_hint_x=0.5,
                        on_release=lambda x: self.load_dashboard_data()
                    ),
                    orientation="horizontal",
                    spacing=dp(10)
                ),
                orientation="vertical",
                spacing=dp(15),
                padding=dp(20)
            ),
            elevation=2,
            size_hint_y=None,
            height=dp(120)
        )
        
        layout.add_widget(welcome_card)
        layout.add_widget(stats_card)
        layout.add_widget(actions_card)
        
        self.overview_content.clear_widgets()
        self.overview_content.add_widget(layout)

    def create_stat_card(self, title, value, icon, color):
        """Create a stat card"""
        return MDCard(
            MDBoxLayout(
                MDLabel(
                    text=icon,
                    font_size=dp(24),
                    halign="center",
                    size_hint_y=None,
                    height=dp(30)
                ),
                MDLabel(
                    text=value,
                    font_style="H6",
                    halign="center",
                    theme_text_color="Primary",
                    size_hint_y=None,
                    height=dp(35)
                ),
                MDLabel(
                    text=title,
                    font_style="Caption",
                    halign="center",
                    theme_text_color="Secondary",
                    size_hint_y=None,
                    height=dp(20)
                ),
                orientation="vertical",
                padding=dp(10)
            ),
            elevation=1,
            md_bg_color=color + "15"  # Light tint
        )

    def populate_my_tiffin_tab(self, schedule_resp, deliveries_resp, user_name):
        """Populate my tiffin tab"""
        layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20),
            padding=dp(20)
        )
        
        # My schedule card
        schedule_card = MDCard(
            elevation=2,
            padding=dp(20),
            size_hint_y=None,
            height=dp(250)
        )
        
        schedule_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(10)
        )
        
        schedule_layout.add_widget(MDLabel(
            text=f"{user_name}'s Weekly Schedule",
            font_style="H6",
            theme_text_color="Primary",
            size_hint_y=None,
            height=dp(30)
        ))
        
        if schedule_resp.get('error'):
            schedule_layout.add_widget(MDLabel(
                text="Failed to load schedule",
                theme_text_color="Error"
            ))
        else:
            weekly_schedule = schedule_resp.get('weekly_schedule', {})
            days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            
            for day in days:
                day_data = weekly_schedule.get(day, {})
                enabled = day_data.get('enabled', False)
                time = day_data.get('time', '12:00')
                
                day_layout = MDBoxLayout(
                    orientation="horizontal",
                    spacing=dp(10),
                    size_hint_y=None,
                    height=dp(25)
                )
                
                status_icon = "✅" if enabled else "❌"
                day_layout.add_widget(MDLabel(
                    text=f"{status_icon} {day.title()}",
                    size_hint_x=0.6
                ))
                
                day_layout.add_widget(MDLabel(
                    text=time if enabled else "Off",
                    size_hint_x=0.4,
                    theme_text_color="Secondary"
                ))
                
                schedule_layout.add_widget(day_layout)
        
        edit_btn = MDFlatButton(
            text="EDIT SCHEDULE",
            on_release=lambda x: setattr(self.manager, 'current', 'settings')
        )
        schedule_layout.add_widget(edit_btn)
        
        schedule_card.add_widget(schedule_layout)
        
        # Recent deliveries
        deliveries_card = MDCard(
            elevation=2,
            padding=dp(20),
            size_hint_y=None,
            height=dp(300)
        )
        
        deliveries_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(10)
        )
        
        deliveries_layout.add_widget(MDLabel(
            text="Recent Deliveries (Last 30 days)",
            font_style="H6",
            theme_text_color="Primary",
            size_hint_y=None,
            height=dp(30)
        ))
        
        if isinstance(deliveries_resp, list) and deliveries_resp:
            for delivery in deliveries_resp[:10]:  # Show last 10
                delivered = delivery.get('delivered', False)
                date = delivery.get('delivery_date', '')
                time = delivery.get('scheduled_time', '')
                
                delivery_layout = MDBoxLayout(
                    orientation="horizontal",
                    spacing=dp(10),
                    size_hint_y=None,
                    height=dp(25)
                )
                
                status_icon = "✅" if delivered else "⏳"
                status_text = "Delivered" if delivered else "Pending"
                
                delivery_layout.add_widget(MDLabel(
                    text=f"{status_icon} {date}",
                    size_hint_x=0.5
                ))
                
                delivery_layout.add_widget(MDLabel(
                    text=f"{time} - {status_text}",
                    size_hint_x=0.5,
                    theme_text_color="Secondary"
                ))
                
                deliveries_layout.add_widget(delivery_layout)
        else:
            deliveries_layout.add_widget(MDLabel(
                text="No recent deliveries found",
                theme_text_color="Secondary"
            ))
        
        deliveries_card.add_widget(deliveries_layout)
        
        layout.add_widget(schedule_card)
        layout.add_widget(deliveries_card)
        
        self.my_tiffin_content.clear_widgets()
        self.my_tiffin_content.add_widget(layout)

    def populate_everyone_tab(self, schedules):
        """Populate everyone's schedules tab"""
        layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20),
            padding=dp(20)
        )
        
        layout.add_widget(MDLabel(
            text="Everyone's Tiffin Schedule",
            font_style="H6",
            theme_text_color="Primary",
            size_hint_y=None,
            height=dp(40)
        ))
        
        if not schedules:
            layout.add_widget(MDLabel(
                text="No schedules found",
                theme_text_color="Secondary",
                halign="center"
            ))
        else:
            for schedule in schedules:
                user_card = MDCard(
                    elevation=2,
                    padding=dp(20),
                    size_hint_y=None,
                    height=dp(220)
                )
                
                user_layout = MDBoxLayout(
                    orientation="vertical",
                    spacing=dp(10)
                )
                
                user_layout.add_widget(MDLabel(
                    text=f"👤 {schedule.get('user_name', 'Unknown')}",
                    font_style="Subtitle1",
                    theme_text_color="Primary",
                    size_hint_y=None,
                    height=dp(30)
                ))
                
                weekly_schedule = schedule.get('weekly_schedule', {})
                days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                
                for day in days:
                    day_data = weekly_schedule.get(day, {})
                    enabled = day_data.get('enabled', False)
                    time = day_data.get('time', '12:00')
                    
                    day_layout = MDBoxLayout(
                        orientation="horizontal",
                        spacing=dp(10),
                        size_hint_y=None,
                        height=dp(20)
                    )
                    
                    status_icon = "✅" if enabled else "❌"
                    day_layout.add_widget(MDLabel(
                        text=f"{status_icon} {day.title()}",
                        size_hint_x=0.6,
                        font_style="Caption"
                    ))
                    
                    day_layout.add_widget(MDLabel(
                        text=time if enabled else "Off",
                        size_hint_x=0.4,
                        theme_text_color="Secondary",
                        font_style="Caption"
                    ))
                    
                    user_layout.add_widget(day_layout)
                
                user_card.add_widget(user_layout)
                layout.add_widget(user_card)
        
        self.everyone_content.clear_widgets()
        self.everyone_content.add_widget(layout)

    def logout(self, *args):
        """Handle logout"""
        from kivy.app import App
        app = App.get_running_app()
        
        def confirm_logout(instance):
            app.logout()
            self.dialog.dismiss()
        
        def cancel_logout(instance):
            self.dialog.dismiss()
        
        self.dialog = MDDialog(
            title="Confirm Logout",
            text="Are you sure you want to logout?",
            buttons=[
                MDFlatButton(
                    text="CANCEL",
                    on_release=cancel_logout
                ),
                MDRaisedButton(
                    text="LOGOUT",
                    on_release=confirm_logout
                ),
            ],
        )
        self.dialog.open()

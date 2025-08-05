import asyncio
import threading
from datetime import datetime
from kivymd.uix.screen import MDScreen
from kivymd.uix.card import MDCard
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.gridlayout import MDGridLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.button import MDRaisedButton, MDIconButton, MDFlatButton
from kivymd.uix.textfield import MDTextField
from kivymd.uix.selectioncontrol import MDCheckbox
from kivymd.uix.dialog import MDDialog
from kivymd.toast import toast
from kivymd.uix.tab import MDTabs, MDTabsBase
from kivymd.uix.floatlayout import MDFloatLayout
from kivy.clock import Clock
from kivy.metrics import dp

class Tab(MDFloatLayout, MDTabsBase):
    pass

class AuthScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.is_signup = True
        self.build_ui()

    def build_ui(self):
        # Main container
        main_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20),
            padding=[dp(40), dp(60), dp(40), dp(40)],
            md_bg_color=self.theme_cls.bg_light
        )
        
        # App logo/title
        title_card = MDCard(
            MDBoxLayout(
                MDLabel(
                    text="🍱",
                    font_size=dp(48),
                    halign="center",
                    size_hint_y=None,
                    height=dp(60)
                ),
                MDLabel(
                    text="Tiffin Manager",
                    font_style="H5",
                    halign="center",
                    theme_text_color="Primary",
                    size_hint_y=None,
                    height=dp(40)
                ),
                MDLabel(
                    text="Manage your daily tiffin schedule with friends",
                    font_style="Caption",
                    halign="center",
                    theme_text_color="Secondary",
                    size_hint_y=None,
                    height=dp(30)
                ),
                orientation="vertical",
                spacing=dp(10),
                padding=dp(20)
            ),
            elevation=2,
            size_hint_y=None,
            height=dp(160),
            md_bg_color=self.theme_cls.bg_normal
        )
        
        # Auth form card
        self.auth_card = MDCard(
            elevation=3,
            padding=dp(30),
            size_hint_y=None,
            height=dp(400),
            md_bg_color=self.theme_cls.bg_normal
        )
        
        self.form_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20)
        )
        
        # Form title
        self.form_title = MDLabel(
            text="Create Account",
            font_style="H6",
            halign="center",
            theme_text_color="Primary",
            size_hint_y=None,
            height=dp(40)
        )
        
        # Input fields
        self.name_field = MDTextField(
            hint_text="Full Name",
            icon_left="account",
            size_hint_y=None,
            height=dp(56)
        )
        
        self.email_field = MDTextField(
            hint_text="Email Address",
            icon_left="email",
            size_hint_y=None,
            height=dp(56)
        )
        
        self.password_field = MDTextField(
            hint_text="Password",
            icon_left="lock",
            password=True,
            size_hint_y=None,
            height=dp(56)
        )
        
        # Show password checkbox
        password_layout = MDBoxLayout(
            orientation="horizontal",
            spacing=dp(10),
            size_hint_y=None,
            height=dp(40)
        )
        
        self.show_password_check = MDCheckbox(
            size_hint_x=None,
            width=dp(30)
        )
        self.show_password_check.bind(active=self.toggle_password_visibility)
        
        password_layout.add_widget(self.show_password_check)
        password_layout.add_widget(MDLabel(
            text="Show Password",
            theme_text_color="Secondary",
            font_style="Caption"
        ))
        
        # Submit button
        self.submit_button = MDRaisedButton(
            text="CREATE ACCOUNT",
            size_hint_y=None,
            height=dp(48),
            md_bg_color=self.theme_cls.primary_color
        )
        self.submit_button.bind(on_release=self.handle_submit)
        
        # Toggle button
        self.toggle_button = MDFlatButton(
            text="Already have an account? Sign In",
            size_hint_y=None,
            height=dp(40),
            theme_text_color="Primary"
        )
        self.toggle_button.bind(on_release=self.toggle_auth_mode)
        
        # Add to form layout
        self.form_layout.add_widget(self.form_title)
        self.form_layout.add_widget(self.name_field)
        self.form_layout.add_widget(self.email_field)
        self.form_layout.add_widget(self.password_field)
        self.form_layout.add_widget(password_layout)
        self.form_layout.add_widget(self.submit_button)
        self.form_layout.add_widget(self.toggle_button)
        
        self.auth_card.add_widget(self.form_layout)
        
        # Add to main layout
        main_layout.add_widget(title_card)
        main_layout.add_widget(self.auth_card)
        
        self.add_widget(main_layout)

    def toggle_password_visibility(self, checkbox, value):
        self.password_field.password = not value

    def toggle_auth_mode(self, *args):
        self.is_signup = not self.is_signup
        if self.is_signup:
            self.form_title.text = "Create Account"
            self.submit_button.text = "CREATE ACCOUNT"
            self.toggle_button.text = "Already have an account? Sign In"
            self.name_field.disabled = False
            self.name_field.opacity = 1
        else:
            self.form_title.text = "Sign In"
            self.submit_button.text = "SIGN IN"
            self.toggle_button.text = "Don't have an account? Sign Up"
            self.name_field.disabled = True
            self.name_field.opacity = 0.5

    def handle_submit(self, *args):
        from kivy.app import App
        app = App.get_running_app()
        
        name = self.name_field.text.strip()
        email = self.email_field.text.strip()
        password = self.password_field.text.strip()
        
        # Validation
        if not email or "@" not in email:
            toast("Please enter a valid email address")
            return
            
        if self.is_signup:
            if not name:
                toast("Please enter your full name")
                return
            if len(password) < 8:
                toast("Password must be at least 8 characters")
                return
        else:
            if not password:
                toast("Please enter your password")
                return
        
        # Disable button and show loading
        self.submit_button.disabled = True
        self.submit_button.text = "Processing..."
        
        if self.is_signup:
            self.handle_signup(app, name, email, password)
        else:
            self.handle_login(app, email, password)

    def handle_signup(self, app, name, email, password):
        def signup_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def signup():
                try:
                    resp = await app.api.signup({"name": name, "email": email, "password": password})
                    
                    def update_ui():
                        if resp.get("message") == "Signup successful":
                            toast("Account created successfully! Please sign in.")
                            self.toggle_auth_mode()
                            self.clear_fields()
                        elif resp.get("errors"):
                            msg = resp["errors"][0]["msg"] if resp["errors"] else "Signup failed"
                            toast(msg)
                        elif resp.get("error"):
                            toast(str(resp["error"]))
                        else:
                            toast("Signup failed. Please try again.")
                        
                        self.submit_button.disabled = False
                        self.submit_button.text = "CREATE ACCOUNT"
                    
                    Clock.schedule_once(lambda dt: update_ui())
                    
                except Exception as e:
                    Clock.schedule_once(lambda dt: toast(f"Network error: {str(e)}"))
                    Clock.schedule_once(lambda dt: self.reset_button())
            
            loop.run_until_complete(signup())
            loop.close()
        
        threading.Thread(target=signup_thread, daemon=True).start()

    def handle_login(self, app, email, password):
        def login_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def login():
                try:
                    resp = await app.api.login({"email": email, "password": password})
                    
                    def update_ui():
                        user = resp.get("user")
                        token = resp.get("access_token")
                        
                        if user and token:
                            app.storage.set_user(user.get("name"), email, user.get("_id"), token)
                            toast(f"Welcome back, {user.get('name')}!")
                            self.manager.current = "dashboard"
                        elif resp.get("errors"):
                            msg = resp["errors"][0]["msg"] if resp["errors"] else "Login failed"
                            toast(msg)
                        elif resp.get("error"):
                            toast(str(resp["error"]))
                        else:
                            toast("Login failed. Please check your credentials.")
                        
                        self.submit_button.disabled = False
                        self.submit_button.text = "SIGN IN"
                    
                    Clock.schedule_once(lambda dt: update_ui())
                    
                except Exception as e:
                    Clock.schedule_once(lambda dt: toast(f"Network error: {str(e)}"))
                    Clock.schedule_once(lambda dt: self.reset_button())
            
            loop.run_until_complete(login())
            loop.close()
        
        threading.Thread(target=login_thread, daemon=True).start()

    def reset_button(self):
        self.submit_button.disabled = False
        self.submit_button.text = "CREATE ACCOUNT" if self.is_signup else "SIGN IN"

    def clear_fields(self):
        self.name_field.text = ""
        self.email_field.text = ""
        self.password_field.text = ""

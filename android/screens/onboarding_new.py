import asyncio
import threading
from kivymd.uix.screen import MDScreen
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.textfield import MDTextField
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.selectioncontrol import MDCheckbox
from kivymd.toast import toast
from kivy.clock import Clock

class OnboardingScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.is_signup = True
        self.setup_ui()

    def setup_ui(self):
        self.layout = MDBoxLayout(orientation="vertical", spacing=20, padding=40)
        
        # Title
        self.layout.add_widget(MDLabel(text="Tiffin Manager", halign="center", font_style="H4"))
        
        # Input fields
        self.name_input = MDTextField(hint_text="Your Name", pos_hint={"center_x": 0.5}, size_hint_x=0.8)
        self.email_input = MDTextField(hint_text="Email", pos_hint={"center_x": 0.5}, size_hint_x=0.8)
        self.password_input = MDTextField(hint_text="Password", pos_hint={"center_x": 0.5}, size_hint_x=0.8, password=True)
        
        # Show password checkbox
        self.show_password_checkbox = MDCheckbox()
        self.show_password_checkbox.bind(active=self.toggle_password_visibility)
        pw_box = MDBoxLayout(orientation="horizontal", size_hint_x=0.8, pos_hint={"center_x": 0.5})
        pw_box.add_widget(self.password_input)
        pw_box.add_widget(MDLabel(text="Show", size_hint_x=0.2))
        pw_box.add_widget(self.show_password_checkbox)
        
        # Buttons
        self.submit_btn = MDRaisedButton(text="Sign Up", pos_hint={"center_x": 0.5})
        self.submit_btn.bind(on_release=self.on_submit)
        
        self.toggle_btn = MDRaisedButton(text="Switch to Login", pos_hint={"center_x": 0.5})
        self.toggle_btn.bind(on_release=self.toggle_mode)
        
        # Add widgets to layout
        self.layout.add_widget(self.name_input)
        self.layout.add_widget(self.email_input)
        self.layout.add_widget(pw_box)
        self.layout.add_widget(self.submit_btn)
        self.layout.add_widget(self.toggle_btn)
        
        self.add_widget(self.layout)

    def toggle_password_visibility(self, checkbox, value):
        self.password_input.password = not value

    def toggle_mode(self, *args):
        self.is_signup = not self.is_signup
        if self.is_signup:
            self.submit_btn.text = "Sign Up"
            self.toggle_btn.text = "Switch to Login"
            self.name_input.disabled = False
        else:
            self.submit_btn.text = "Login"
            self.toggle_btn.text = "Switch to Sign Up"
            self.name_input.disabled = True

    def on_submit(self, *args):
        from kivy.app import App
        app = App.get_running_app()
        
        name = self.name_input.text.strip()
        email = self.email_input.text.strip()
        password = self.password_input.text.strip()
        
        print(f"[DEBUG] Submit clicked - Mode: {'signup' if self.is_signup else 'login'}")
        
        # Basic validation
        if not email or "@" not in email:
            toast("Enter a valid email address")
            return
        if self.is_signup and (not name or len(password) < 8):
            toast("Name required and password must be at least 8 characters")
            return
        if not self.is_signup and not password:
            toast("Password required")
            return
            
        # Disable button to prevent multiple clicks
        self.submit_btn.disabled = True
        
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
                    print("[DEBUG] Sending signup request...")
                    resp = await app.api.signup({"name": name, "email": email, "password": password})
                    print(f"[DEBUG] Signup response: {resp}")
                    
                    def update_ui():
                        if resp.get("message") == "Signup successful":
                            toast("Signup successful! Please login.")
                            self.toggle_mode()
                        elif resp.get("errors"):
                            msg = resp["errors"][0]["msg"] if resp["errors"] else str(resp)
                            toast(msg)
                        elif resp.get("error"):
                            toast(str(resp["error"]))
                        else:
                            toast(f"Signup failed: {resp}")
                        self.submit_btn.disabled = False
                    
                    Clock.schedule_once(lambda dt: update_ui())
                    
                except Exception as e:
                    print(f"[DEBUG] Signup exception: {e}")
                    Clock.schedule_once(lambda dt: toast(f"Error: {e}"))
                    Clock.schedule_once(lambda dt: setattr(self.submit_btn, 'disabled', False))
            
            loop.run_until_complete(signup())
            loop.close()
        
        threading.Thread(target=signup_thread, daemon=True).start()

    def handle_login(self, app, email, password):
        def login_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def login():
                try:
                    print("[DEBUG] Sending login request...")
                    resp = await app.api.login({"email": email, "password": password})
                    print(f"[DEBUG] Login response: {resp}")
                    
                    def update_ui():
                        user = resp.get("user")
                        token = resp.get("access_token")
                        if user and token:
                            app.storage.set_user(user.get("name"), email, user.get("_id"), token)
                            toast("Login successful!")
                            self.manager.current = "dashboard"
                        elif resp.get("errors"):
                            msg = resp["errors"][0]["msg"] if resp["errors"] else str(resp)
                            toast(msg)
                        elif resp.get("error"):
                            toast(str(resp["error"]))
                        else:
                            toast(f"Login failed: {resp}")
                        self.submit_btn.disabled = False
                    
                    Clock.schedule_once(lambda dt: update_ui())
                    
                except Exception as e:
                    print(f"[DEBUG] Login exception: {e}")
                    Clock.schedule_once(lambda dt: toast(f"Error: {e}"))
                    Clock.schedule_once(lambda dt: setattr(self.submit_btn, 'disabled', False))
            
            loop.run_until_complete(login())
            loop.close()
        
        threading.Thread(target=login_thread, daemon=True).start()

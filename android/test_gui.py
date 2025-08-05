"""
Minimal GUI test to identify the crash issue
"""
from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.label import MDLabel
from kivymd.uix.boxlayout import MDBoxLayout

class TestScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        layout = MDBoxLayout(
            orientation="vertical",
            spacing=20,
            pos_hint={"center_x": 0.5, "center_y": 0.5},
            size_hint=(0.8, 0.6)
        )
        
        layout.add_widget(MDLabel(
            text="🍛 Tiffin Management GUI Test",
            theme_text_color="Primary",
            halign="center",
            size_hint_y=None,
            height=60
        ))
        
        layout.add_widget(MDLabel(
            text="If you can see this, the GUI is working!",
            theme_text_color="Secondary",
            halign="center"
        ))
        
        self.add_widget(layout)

class MinimalTiffinApp(MDApp):
    def build(self):
        self.title = "Tiffin GUI Test"
        self.theme_cls.theme_style = "Light"
        self.theme_cls.primary_palette = "DeepPurple"
        self.theme_cls.material_style = "M3"
        
        return TestScreen()

if __name__ == "__main__":
    print("🧪 Testing minimal GUI...")
    try:
        MinimalTiffinApp().run()
    except Exception as e:
        print(f"❌ Minimal GUI failed: {e}")
        import traceback
        traceback.print_exc()

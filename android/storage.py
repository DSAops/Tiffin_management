import json
import os

class Storage:
    def __init__(self):
        self.file = "user_data.json"
        self.data = self._load()

    def _load(self):
        """Load data from file"""
        if os.path.exists(self.file):
            try:
                with open(self.file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def save(self):
        """Save data to file"""
        try:
            with open(self.file, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"Error saving data: {e}")

    def set_user(self, name, email, user_id, token):
        """Store user data"""
        self.data["name"] = name
        self.data["email"] = email
        self.data["user_id"] = user_id
        self.data["access_token"] = token
        self.save()

    def get_user(self):
        """Get user data"""
        return (
            self.data.get("name"),
            self.data.get("email"),
            self.data.get("user_id")
        )

    def get_token(self):
        """Get access token"""
        return self.data.get("access_token")

    def has_user(self):
        """Check if user is logged in"""
        return all(self.data.get(k) for k in ("name", "email", "user_id", "access_token"))

    def clear(self):
        """Clear all data"""
        self.data = {}
        self.save()

    def get_user_name(self):
        """Get just the user name"""
        return self.data.get("name", "User")

    def get_user_id(self):
        """Get just the user ID"""
        return self.data.get("user_id")

    def is_logged_in(self):
        """Check if user is logged in (alias for has_user)"""
        return self.has_user()

    def get_user_data(self):
        """Get user data as dictionary"""
        return {
            "name": self.data.get("name"),
            "email": self.data.get("email"),
            "id": self.data.get("user_id")
        }

    def save_user_data(self, user_data, token):
        """Save user data and token"""
        self.set_user(
            user_data.get("name"),
            user_data.get("email"), 
            user_data.get("id"),
            token
        )

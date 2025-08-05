import httpx
import os
from dotenv import load_dotenv

load_dotenv()

class APIClient:
    def __init__(self, storage):
        self.base_url = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
        self.storage = storage
        self.client = httpx.AsyncClient()

    async def signup(self, data):
        """Register a new user"""
        try:
            resp = await self.client.post(f"{self.base_url}/users/signup", json=data)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            try:
                return e.response.json()
            except:
                return {"error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            return {"error": str(e)}

    async def login(self, data):
        """Login user"""
        try:
            resp = await self.client.post(f"{self.base_url}/users/login", json=data)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            try:
                return e.response.json()
            except:
                return {"error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            return {"error": str(e)}

    async def get_my_schedule(self, user_id):
        """Get user's tiffin schedule"""
        try:
            token = self.storage.get_token()
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            resp = await self.client.get(f"{self.base_url}/tiffin/schedule/{user_id}", headers=headers)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            try:
                return e.response.json()
            except:
                return {"error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            return {"error": str(e)}

    async def update_schedule(self, user_id, weekly_schedule, holiday_mode=None):
        """Update user's tiffin schedule"""
        try:
            token = self.storage.get_token()
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            
            payload = {"weekly_schedule": weekly_schedule}
            if holiday_mode:
                payload["holiday_mode"] = holiday_mode
                
            resp = await self.client.put(
                f"{self.base_url}/tiffin/schedule/{user_id}", 
                json=payload, 
                headers=headers
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            try:
                return e.response.json()
            except:
                return {"error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            return {"error": str(e)}

    async def get_dashboard_stats(self):
        """Get dashboard statistics"""
        try:
            token = self.storage.get_token()
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            resp = await self.client.get(f"{self.base_url}/tiffin/dashboard/stats", headers=headers)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            try:
                return e.response.json()
            except:
                return {"error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            return {"error": str(e)}

    async def get_my_deliveries(self, user_id, days=30):
        """Get user's delivery history"""
        try:
            token = self.storage.get_token()
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            resp = await self.client.get(f"{self.base_url}/tiffin/deliveries/{user_id}?days={days}", headers=headers)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            try:
                return e.response.json()
            except:
                return {"error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            return {"error": str(e)}

    async def mark_delivered(self, delivery_id):
        """Mark a delivery as completed"""
        try:
            token = self.storage.get_token()
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            resp = await self.client.patch(f"{self.base_url}/tiffin/delivery/{delivery_id}/delivered", headers=headers)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            try:
                return e.response.json()
            except:
                return {"error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            return {"error": str(e)}

    async def get_all_schedules(self):
        """Get all users' tiffin schedules"""
        try:
            token = self.storage.get_token()
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            resp = await self.client.get(f"{self.base_url}/tiffin/schedules/all", headers=headers)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            try:
                return e.response.json()
            except:
                return {"error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            return {"error": str(e)}

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

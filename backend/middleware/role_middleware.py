from functools import wraps
from flask import jsonify


def require_roles(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(user, *args, **kwargs):
            if user.get("role") not in roles:
                return jsonify({"message": "Access denied"}), 403

            return fn(user, *args, **kwargs)

        return decorator
    return wrapper
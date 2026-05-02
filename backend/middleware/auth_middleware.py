from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models.user_model import find_user_by_id
from functools import wraps
from flask import jsonify


def auth_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                user = find_user_by_id(user_id)

                if not user:
                    return jsonify({"message": "User not found"}), 404

                return fn(user, *args, **kwargs)

            except Exception:
                return jsonify({"message": "Unauthorized"}), 401

        return decorator
    return wrapper
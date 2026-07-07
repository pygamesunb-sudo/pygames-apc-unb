import asyncio
import os
import sys

# Garante que o diretório atual está no PYTHONPATH para carregar os módulos do app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services import firebase_service

async def delete_pytest_data():
    db = firebase_service.get_db()
    if db is None:
        print("Could not initialize Firestore client. Make sure firebase_credentials.json or a valid Firebase token is present.")
        return

    print("Connected to Firestore. Starting cleanup of test data...")

    # 1. Clean users
    users_ref = db.collection("users")
    deleted_users = 0
    
    # Query for specific test users
    for user_doc in users_ref.where("name", "==", "Pytest User").stream():
        print(f"Deleting user by name 'Pytest User': {user_doc.id} - {user_doc.to_dict().get('email')}")
        user_doc.reference.delete()
        deleted_users += 1

    for user_doc in users_ref.where("email", "==", "test@pytest.com").stream():
        print(f"Deleting user by email 'test@pytest.com': {user_doc.id}")
        user_doc.reference.delete()
        deleted_users += 1

    for user_doc in users_ref.where("email", "==", "leader@pytest.com").stream():
        print(f"Deleting user by email 'leader@pytest.com': {user_doc.id}")
        user_doc.reference.delete()
        deleted_users += 1

    for user_doc in users_ref.where("email", "==", "exercise@pytest.com").stream():
        print(f"Deleting user by email 'exercise@pytest.com': {user_doc.id}")
        user_doc.reference.delete()
        deleted_users += 1

    for user_doc in users_ref.where("email", "==", "test@pygameapc.com").stream():
        print(f"Deleting user by email 'test@pygameapc.com': {user_doc.id}")
        user_doc.reference.delete()
        deleted_users += 1

    # Check for test-user-uid-12345
    test_user_doc = users_ref.document("test-user-uid-12345").get()
    if test_user_doc.exists:
        print(f"Deleting default test user: {test_user_doc.id}")
        test_user_doc.reference.delete()
        deleted_users += 1

    # Check for all users starting with pytest-user-
    for user_doc in users_ref.stream():
        uid = user_doc.id
        if uid.startswith("pytest-user-"):
            print(f"Deleting user with ID prefix: {uid}")
            user_doc.reference.delete()
            deleted_users += 1

    # 2. Clean submissions
    subs_ref = db.collection("submissions")
    deleted_subs = 0
    
    for sub_doc in subs_ref.where("name", "==", "Pytest User").stream():
        print(f"Deleting submission by name 'Pytest User': {sub_doc.id}")
        sub_doc.reference.delete()
        deleted_subs += 1

    for sub_doc in subs_ref.where("email", "==", "test@pytest.com").stream():
        print(f"Deleting submission by email 'test@pytest.com': {sub_doc.id}")
        sub_doc.reference.delete()
        deleted_subs += 1

    for sub_doc in subs_ref.where("email", "==", "test@pygameapc.com").stream():
        print(f"Deleting submission by email 'test@pygameapc.com': {sub_doc.id}")
        sub_doc.reference.delete()
        deleted_subs += 1

    for sub_doc in subs_ref.where("uid", "==", "test-user-uid-12345").stream():
        print(f"Deleting submission by uid 'test-user-uid-12345': {sub_doc.id}")
        sub_doc.reference.delete()
        deleted_subs += 1

    # Check for all submissions with uid starting with pytest-user-
    for sub_doc in subs_ref.stream():
        uid = sub_doc.to_dict().get("uid", "")
        if uid.startswith("pytest-user-"):
            print(f"Deleting submission for user '{uid}': {sub_doc.id}")
            sub_doc.reference.delete()
            deleted_subs += 1

    # 3. Clean problems starting with "pytest-" or "test-"
    problems_ref = db.collection("problems")
    deleted_problems = 0
    
    for prob_doc in problems_ref.stream():
        prob_id = prob_doc.id
        title = prob_doc.to_dict().get("title", "")
        if prob_id.startswith("pytest-") or prob_id.startswith("test-") or title.startswith("Pytest ") or "Test Problem" in title:
            print(f"Deleting test problem: {prob_id} - {title}")
            prob_doc.reference.delete()
            deleted_problems += 1

    print(f"\nCleanup finished. Deleted {deleted_users} users, {deleted_subs} submissions, {deleted_problems} problems.")

if __name__ == "__main__":
    asyncio.run(delete_pytest_data())

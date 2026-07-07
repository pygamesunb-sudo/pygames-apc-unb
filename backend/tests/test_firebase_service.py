import pytest
import uuid
import asyncio
from app.services import firebase_service

def test_save_and_get_problem():
    async def run():
        created_problems = []
        try:
            problem_data = {
                "title": "Pytest Test Problem",
                "description": "This is a test description.",
                "difficulty": "facil",
                "topic": "Recursion",
                "hints": ["Hint 1", "Hint 2"],
                "solution_blocks": ["print(1)", "print(2)"],
                "test_cases": [{"input": "1", "expected_output": "1"}]
            }
            
            problem_id = await firebase_service.save_problem(problem_data)
            assert problem_id
            created_problems.append(problem_id)
            
            retrieved = await firebase_service.get_problem(problem_id)
            assert retrieved
            assert retrieved["title"] == "Pytest Test Problem"
            assert retrieved["difficulty"] == "facil"
            assert retrieved["topic"] == "Recursion"
        finally:
            db = firebase_service.get_db()
            for p_id in created_problems:
                try:
                    db.collection("problems").document(p_id).delete()
                except Exception:
                    pass
    asyncio.run(run())


def test_list_problems():
    async def run():
        created_problems = []
        try:
            problem_data = {
                "title": f"Pytest List Problem {uuid.uuid4()}",
                "difficulty": "facil",
                "topic": "Lists",
                "description": "Short desc",
                "test_cases": []
            }
            
            problem_id = await firebase_service.save_problem(problem_data)
            assert problem_id
            created_problems.append(problem_id)
            
            problems = await firebase_service.list_problems()
            titles = [p["title"] for p in problems]
            assert problem_data["title"] in titles
        finally:
            db = firebase_service.get_db()
            for p_id in created_problems:
                try:
                    db.collection("problems").document(p_id).delete()
                except Exception:
                    pass
    asyncio.run(run())


def test_user_profile_crud():
    async def run():
        test_uid = f"pytest-user-{uuid.uuid4()}"
        created_users = [test_uid]
        try:
            profile = await firebase_service.get_user_profile_data(test_uid)
            assert profile
            assert profile["uid"] == test_uid
            assert profile["coding_points"] == 0
            assert profile["total_score"] == 0
            
            updated = await firebase_service.update_user_game_score(
                uid=test_uid,
                email="test@pytest.com",
                name="Pytest User",
                game_key="doodle",
                score=150
            )
            assert updated["games"]["doodle"] == 150
            assert updated["total_score"] == 150
            assert updated["email"] == "test@pytest.com"
            assert updated["name"] == "Pytest User"
            
            profile2 = await firebase_service.get_user_profile_data(test_uid)
            assert profile2["games"]["doodle"] == 150
            assert profile2["total_score"] == 150
        finally:
            db = firebase_service.get_db()
            for u_id in created_users:
                try:
                    db.collection("users").document(u_id).delete()
                except Exception:
                    pass
    asyncio.run(run())


def test_save_submission_updates_points():
    async def run():
        test_uid = f"pytest-user-{uuid.uuid4()}"
        test_problem_id = f"pytest-problem-{uuid.uuid4()}"
        created_users = [test_uid]
        created_problems = [test_problem_id]
        created_submissions = []
        try:
            await firebase_service.get_user_profile_data(test_uid)
            
            updated_profile = await firebase_service.save_submission_to_db(
                uid=test_uid,
                email="test@pytest.com",
                name="Pytest User",
                problem_id=test_problem_id,
                problem_title="Pytest Test Problem Title",
                code="print(1)",
                score=100,
                all_passed=True
            )
            
            db = firebase_service.get_db()
            subs = db.collection("submissions").where("uid", "==", test_uid).stream()
            for sub in subs:
                created_submissions.append(sub.id)
                    
            assert updated_profile["coding_points"] == 50
            assert test_problem_id in updated_profile["solved_problems"]
            
            updated_profile2 = await firebase_service.save_submission_to_db(
                uid=test_uid,
                email="test@pytest.com",
                name="Pytest User",
                problem_id=test_problem_id,
                problem_title="Pytest Test Problem Title",
                code="print(2)",
                score=100,
                all_passed=True
            )
            assert updated_profile2["coding_points"] == 50
        finally:
            db = firebase_service.get_db()
            for p_id in created_problems:
                try:
                    db.collection("problems").document(p_id).delete()
                except Exception:
                    pass
            for u_id in created_users:
                try:
                    db.collection("users").document(u_id).delete()
                except Exception:
                    pass
            for s_id in created_submissions:
                try:
                    db.collection("submissions").document(s_id).delete()
                except Exception:
                    pass
    asyncio.run(run())


def test_get_leaderboard_data():
    async def run():
        test_uid = f"pytest-user-{uuid.uuid4()}"
        created_users = [test_uid]
        try:
            await firebase_service.update_user_game_score(
                uid=test_uid,
                email="leader@pytest.com",
                name="Leader User",
                game_key="snake",
                score=9999
            )
            
            leaderboard = await firebase_service.get_leaderboard_data()
            assert len(leaderboard) > 0
            uids = [u["uid"] for u in leaderboard]
            assert test_uid in uids
        finally:
            db = firebase_service.get_db()
            for u_id in created_users:
                try:
                    db.collection("users").document(u_id).delete()
                except Exception:
                    pass
    asyncio.run(run())


def test_register_solved_exercise_points():
    async def run():
        test_uid = f"pytest-user-{uuid.uuid4()}"
        created_users = [test_uid]
        try:
            exercise_id = f"exercise-{uuid.uuid4()}"
            
            profile = await firebase_service.register_solved_exercise_points(
                uid=test_uid,
                email="exercise@pytest.com",
                name="Exercise Solver",
                exercise_id=exercise_id
            )
            
            assert profile["coding_points"] == 50
            assert exercise_id in profile["solved_problems"]
        finally:
            db = firebase_service.get_db()
            for u_id in created_users:
                try:
                    db.collection("users").document(u_id).delete()
                except Exception:
                    pass
    asyncio.run(run())


def test_check_and_update_rate_limit():
    async def run():
        test_uid = f"pytest-user-{uuid.uuid4()}"
        created_users = [test_uid]
        try:
            res1 = await firebase_service.check_and_update_rate_limit(test_uid, max_daily=2)
            assert res1 is True
            
            res2 = await firebase_service.check_and_update_rate_limit(test_uid, max_daily=2)
            assert res2 is True
            
            res3 = await firebase_service.check_and_update_rate_limit(test_uid, max_daily=2)
            assert res3 is False
        finally:
            db = firebase_service.get_db()
            for u_id in created_users:
                try:
                    db.collection("users").document(u_id).delete()
                except Exception:
                    pass
    asyncio.run(run())

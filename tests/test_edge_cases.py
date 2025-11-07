import urllib.parse

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture(autouse=True)
def reset_activities():
    # ensure we start fresh for each test
    import copy

    orig = copy.deepcopy(app_module.activities)
    yield
    app_module.activities = orig


@pytest.fixture()
def client():
    return TestClient(app_module.app)


def test_signup_when_activity_full(client):
    # pick a small max activity for the test
    activity = "Chess Club"
    # temporarily set max_participants to current count to simulate full
    current = client.get("/activities").json()[activity]["participants"]
    # set max to current length so it's full
    app_module.activities[activity]["max_participants"] = len(current)

    # attempt to sign up a new user
    email = "full.test@mergington.edu"
    r = client.post(f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}")

    # Expected optimal behavior: service should prevent signing up when full (status 400 or 409)
    # Current implementation does not check capacity; assert that we do NOT allow silently exceeding
    assert r.status_code in (400, 409), f"Expected rejection when full, got {r.status_code}"


def test_signup_missing_email_returns_422(client):
    activity = "Chess Club"
    r = client.post(f"/activities/{urllib.parse.quote(activity)}/signup")
    assert r.status_code == 422


def test_email_case_insensitive_duplicate_detection(client):
    activity = "Chess Club"
    email_lower = "case.test@mergington.edu"
    email_upper = "CASE.TEST@mergington.edu"

    # sign up with lowercase
    r1 = client.post(f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email_lower)}")
    assert r1.status_code == 200

    # attempt sign up with different case
    r2 = client.post(f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email_upper)}")

    # Optimal behavior: treat emails case-insensitively and reject duplicate (400). Current behavior may accept.
    assert r2.status_code == 400, f"Expected duplicate rejection, got {r2.status_code}"

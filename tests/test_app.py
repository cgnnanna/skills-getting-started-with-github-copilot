import copy
import urllib.parse

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture(autouse=True)
def reset_activities():
    """Restore the in-memory activities after each test to keep tests isolated."""
    original = copy.deepcopy(app_module.activities)
    yield
    app_module.activities = original


@pytest.fixture()
def client():
    return TestClient(app_module.app)


def test_get_activities(client):
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    # basic sanity: known activity present
    assert "Chess Club" in data


def test_signup_duplicate_and_unregister_flow(client):
    activity = "Chess Club"
    email = "alice.test@mergington.edu"

    activity_q = urllib.parse.quote(activity, safe="")
    email_q = urllib.parse.quote(email, safe="")

    # sign up
    r = client.post(f"/activities/{activity_q}/signup?email={email_q}")
    assert r.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]

    # duplicate signup should return 400
    r2 = client.post(f"/activities/{activity_q}/signup?email={email_q}")
    assert r2.status_code == 400

    # unregister
    r3 = client.delete(f"/activities/{activity_q}/participants?email={email_q}")
    assert r3.status_code == 200
    assert email not in client.get("/activities").json()[activity]["participants"]


def test_unregister_nonexistent_participant_returns_404(client):
    activity = "Chess Club"
    email = "not.registered@mergington.edu"
    activity_q = urllib.parse.quote(activity, safe="")
    email_q = urllib.parse.quote(email, safe="")

    r = client.delete(f"/activities/{activity_q}/participants?email={email_q}")
    assert r.status_code == 404

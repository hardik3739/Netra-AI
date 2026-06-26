"""
Pytest configuration and fixtures for NetraAI tests.
"""

import pytest
import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use in-memory SQLite for tests (fast, isolated)
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def test_db_engine():
    """Create test database engine."""
    engine = create_engine(
        SQLALCHEMY_TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    # Create all tables
    from app.models.database import Base
    Base.metadata.create_all(bind=engine)
    yield engine
    # Cleanup
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_db_session(test_db_engine):
    """Provide a test database session for each test."""
    from app.models.database import Base
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)
    
    # Clear all tables before each test
    Base.metadata.drop_all(bind=test_db_engine)
    Base.metadata.create_all(bind=test_db_engine)
    
    session = TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture
def sample_nlp_flags():
    """Mock NLP flags for testing."""
    return [
        "Company FRAUDCO PRIVATE LIMITED is STRUCK OFF in MCA21 registry",
        "Struck-off company legally cannot employ staff in India"
    ]


@pytest.fixture
def sample_entities():
    """Mock entity dict for testing."""
    return {
        "companies": ["FRAUDCO PRIVATE LIMITED"],
        "amounts": [500000, 1000000],
        "dates": ["2024-01-15"],
        "pan_numbers": ["AAAPF5055K"],
        "survey_numbers": ["SY789012"],
        "ifsc_codes": ["CANB0000001"]
    }


@pytest.fixture
def sample_clean_entities():
    """Mock clean entity dict for testing."""
    return {
        "companies": ["TATA CONSULTANCY SERVICES"],
        "amounts": [50000],
        "dates": ["2024-01-15"],
        "pan_numbers": ["AATCT0055A"],
        "survey_numbers": [],
        "ifsc_codes": []
    }

from . import firebase
from .database.postgres import clean_up as _db_clean_up
from .database.postgres import get_conn
from .database.postgres import start_up as _db_start_up


def start_up() -> None:
    _db_start_up()
    firebase.init()


def clean_up() -> None:
    _db_clean_up()


__all__ = ["start_up", "clean_up", "get_conn"]

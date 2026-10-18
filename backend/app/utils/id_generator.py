from __future__ import annotations
from datetime import datetime
from sqlalchemy.orm import Session


def generate_id(db: Session, model, id_field: str, prefix: str) -> str:
    """
    Generic ID generator.
    Format: PREFIX-YYYY-XXXX (e.g. DOC-2026-0001)
    """
    current_year = datetime.now().year
    id_prefix = f"{prefix}-{current_year}-"

    last_record = (
        db.query(model)
        .filter(getattr(model, id_field).like(f"{id_prefix}%"))
        .order_by(getattr(model, "id").desc())
        .first()
    )

    if last_record:
        last_num = int(getattr(last_record, id_field).split("-")[-1])
        new_num = last_num + 1
    else:
        new_num = 1

    return f"{id_prefix}{str(new_num).zfill(4)}"

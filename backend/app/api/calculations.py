from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.calculation import (
    CalculationCreate,
    CalculationResponse,
)
from app.services import (
    calculation_service,
    report_service,
)


router = APIRouter(
    prefix="/calculations",
    tags=["calculations"]
)


def _get_owned_calculation(
    db: Session,
    calculation_id: int,
    current_user: User,
):
    calculation = calculation_service.get_calculation(
        db,
        calculation_id
    )

    if not calculation:
        raise HTTPException(
            status_code=404,
            detail="Calcul introuvable"
        )

    # Protection contre l'accès aux données d'un autre utilisateur.
    if calculation.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Vous n'avez pas accès à ce calcul"
        )

    return calculation


@router.post(
    "/",
    response_model=CalculationResponse
)
def create_calculation(
    payload: CalculationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return calculation_service.create_calculation(
        db,
        payload,
        current_user.id,
    )


@router.get(
    "/user",
    response_model=list[CalculationResponse]
)
def list_my_calculations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return calculation_service.get_user_calculations(
        db,
        current_user.id,
    )


@router.get(
    "/{calculation_id}",
    response_model=CalculationResponse
)
def get_calculation(
    calculation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_calculation(
        db,
        calculation_id,
        current_user,
    )


@router.get("/{calculation_id}/pdf")
def download_pdf(
    calculation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    calc = _get_owned_calculation(
        db,
        calculation_id,
        current_user,
    )

    pdf_bytes = report_service.generate_pdf(
        calc,
        current_user,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'attachment; filename="rapport_empreinte_{calculation_id}.pdf"'
        },
    )


@router.get("/{calculation_id}/excel")
def download_excel(
    calculation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    calc = _get_owned_calculation(
        db,
        calculation_id,
        current_user,
    )

    excel_bytes = report_service.generate_excel(
        calc,
        current_user,
    )

    return Response(
        content=excel_bytes,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
                f'attachment; filename="empreinte_{calculation_id}.xlsx"'
        },
    )
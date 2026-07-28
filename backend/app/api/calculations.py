from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.calculation import CalculationCreate, CalculationResponse
from app.services import calculation_service, report_service, user_service

router = APIRouter(prefix="/calculations", tags=["calculations"])


def _get_calculation_and_user(db: Session, calculation_id: int):
    calc = calculation_service.get_calculation(db, calculation_id)
    if not calc:
        raise HTTPException(status_code=404, detail="Calcul introuvable")
    user = user_service.get_user_by_id(db, calc.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return calc, user


@router.post("/", response_model=CalculationResponse)
def create_calculation(payload: CalculationCreate, db: Session = Depends(get_db)):
    return calculation_service.create_calculation(db, payload)


@router.get("/user/{user_id}", response_model=list[CalculationResponse])
def list_user_calculations(user_id: int, db: Session = Depends(get_db)):
    return calculation_service.get_user_calculations(db, user_id)


@router.get("/{calculation_id}", response_model=CalculationResponse)
def get_calculation(calculation_id: int, db: Session = Depends(get_db)):
    calc = calculation_service.get_calculation(db, calculation_id)
    if not calc:
        raise HTTPException(status_code=404, detail="Calcul introuvable")
    return calc


@router.get("/{calculation_id}/pdf")
def download_pdf(calculation_id: int, db: Session = Depends(get_db)):
    calc, user = _get_calculation_and_user(db, calculation_id)
    pdf_bytes = report_service.generate_pdf(calc, user)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="rapport_empreinte_{calculation_id}.pdf"'},
    )


@router.get("/{calculation_id}/excel")
def download_excel(calculation_id: int, db: Session = Depends(get_db)):
    calc, user = _get_calculation_and_user(db, calculation_id)
    excel_bytes = report_service.generate_excel(calc, user)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="empreinte_{calculation_id}.xlsx"'},
    )
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Program(Base):
    __tablename__ = "programs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    name = Column(String, nullable=False)
    resolution = Column(String, nullable=True)
    total_hours = Column(String, nullable=True)
    certificate_type = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="programs")
    students = relationship("Student", back_populates="program")
    enrollments = relationship("Enrollment", back_populates="program")


class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    full_name = Column(String, nullable=False)
    document_type = Column(String, nullable=False)
    document_number = Column(String, nullable=False)
    document_place = Column(String, nullable=True)
    address = Column(String, nullable=True)
    neighborhood = Column(String, nullable=True)
    commune = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    is_minor = Column(Boolean, default=False)
    guardian_name = Column(String, nullable=True)
    guardian_document = Column(String, nullable=True)
    guardian_address = Column(String, nullable=True)
    guardian_phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    program_id = Column(String, ForeignKey("programs.id"), nullable=False)
    enrollment_number = Column(String, nullable=True)
    folio = Column(String, nullable=True)
    certificate_type = Column(String, nullable=True)
    year = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="enrollments")
    student = relationship("Student", back_populates="enrollments")
    program = relationship("Program", back_populates="enrollments")

"""Initial Readable schema."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260423_0001"
down_revision = None
branch_labels = None
depends_on = None


user_role = postgresql.ENUM("student", "teacher", name="user_role", create_type=False)
session_type = postgresql.ENUM(
    "diagnostic", "reading", name="session_type", create_type=False
)
lesson_content_type = postgresql.ENUM(
    "text", "pdf", "image", name="lesson_content_type", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    user_role.create(bind, checkfirst=True)
    session_type.create(bind, checkfirst=True)
    lesson_content_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "student_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reading_level", sa.String(), nullable=True),
        sa.Column("avg_speed_wpm", sa.Float(), nullable=False, server_default="0"),
        sa.Column("avg_accuracy_pct", sa.Float(), nullable=False, server_default="0"),
        sa.Column("attention_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("difficult_words", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_student_profiles_id"), "student_profiles", ["id"], unique=False)
    op.create_unique_constraint("uq_student_profiles_user_id", "student_profiles", ["user_id"])

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("session_type", session_type, nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f("ix_sessions_id"), "sessions", ["id"], unique=False)
    op.create_index(op.f("ix_sessions_student_id"), "sessions", ["student_id"], unique=False)

    op.create_table(
        "lessons",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("teacher_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("raw_content", sa.Text(), nullable=False),
        sa.Column("processed_content", sa.Text(), nullable=False),
        sa.Column("content_type", lesson_content_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_lessons_id"), "lessons", ["id"], unique=False)
    op.create_index(op.f("ix_lessons_teacher_id"), "lessons", ["teacher_id"], unique=False)

    op.create_table(
        "session_results",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("spoken_text", sa.Text(), nullable=False),
        sa.Column("expected_text", sa.Text(), nullable=False),
        sa.Column("errors", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("speed_wpm", sa.Float(), nullable=False),
        sa.Column("hesitation_points", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("eye_tracking_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("accuracy_pct", sa.Float(), nullable=False),
    )
    op.create_index(op.f("ix_session_results_id"), "session_results", ["id"], unique=False)
    op.create_index(op.f("ix_session_results_session_id"), "session_results", ["session_id"], unique=False)
    op.create_unique_constraint("uq_session_results_session_id", "session_results", ["session_id"])

    op.create_table(
        "personalized_content",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("adapted_content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("syllable_breaks", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("font_size", sa.Integer(), nullable=False),
        sa.Column("spacing", sa.Float(), nullable=False),
        sa.Column("chunk_size", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_personalized_content_id"), "personalized_content", ["id"], unique=False)
    op.create_index(op.f("ix_personalized_content_lesson_id"), "personalized_content", ["lesson_id"], unique=False)
    op.create_index(op.f("ix_personalized_content_student_id"), "personalized_content", ["student_id"], unique=False)

    op.create_table(
        "progress_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("accuracy_trend", sa.Float(), nullable=False),
        sa.Column("words_practiced", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_progress_entries_id"), "progress_entries", ["id"], unique=False)
    op.create_index(op.f("ix_progress_entries_session_id"), "progress_entries", ["session_id"], unique=False)
    op.create_index(op.f("ix_progress_entries_student_id"), "progress_entries", ["student_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_progress_entries_student_id"), table_name="progress_entries")
    op.drop_index(op.f("ix_progress_entries_session_id"), table_name="progress_entries")
    op.drop_index(op.f("ix_progress_entries_id"), table_name="progress_entries")
    op.drop_table("progress_entries")

    op.drop_index(op.f("ix_personalized_content_student_id"), table_name="personalized_content")
    op.drop_index(op.f("ix_personalized_content_lesson_id"), table_name="personalized_content")
    op.drop_index(op.f("ix_personalized_content_id"), table_name="personalized_content")
    op.drop_table("personalized_content")

    op.drop_constraint("uq_session_results_session_id", "session_results", type_="unique")
    op.drop_index(op.f("ix_session_results_session_id"), table_name="session_results")
    op.drop_index(op.f("ix_session_results_id"), table_name="session_results")
    op.drop_table("session_results")

    op.drop_index(op.f("ix_lessons_teacher_id"), table_name="lessons")
    op.drop_index(op.f("ix_lessons_id"), table_name="lessons")
    op.drop_table("lessons")

    op.drop_index(op.f("ix_sessions_student_id"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_id"), table_name="sessions")
    op.drop_table("sessions")

    op.drop_constraint("uq_student_profiles_user_id", "student_profiles", type_="unique")
    op.drop_index(op.f("ix_student_profiles_id"), table_name="student_profiles")
    op.drop_table("student_profiles")

    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    lesson_content_type.drop(bind, checkfirst=True)
    session_type.drop(bind, checkfirst=True)
    user_role.drop(bind, checkfirst=True)

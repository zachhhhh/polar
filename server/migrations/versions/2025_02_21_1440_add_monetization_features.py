"""Add monetization features

Revision ID: 2025_02_21_1440
Revises: 1769a6e618a4
Create Date: 2025-02-21 14:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = '2025_02_21_1440'
down_revision = '1769a6e618a4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = {t for t in inspector.get_table_names()}

    if "subscriptions" in tables:
        columns = {c["name"]: c for c in inspector.get_columns("subscriptions")}
        indexes = {i["name"] for i in inspector.get_indexes("subscriptions")}
        fks = {fk["name"] for fk in inspector.get_foreign_keys("subscriptions")}

        # Add organization_id column first
        if "organization_id" not in columns:
            op.add_column('subscriptions',
                sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=True)
            )
            if "subscriptions_organization_id_fkey" not in fks:
                op.create_foreign_key(
                    'subscriptions_organization_id_fkey',
                    'subscriptions',
                    'organizations',
                    ['organization_id'],
                    ['id']
                )

        # Add new columns to subscriptions table
        if "tier" not in columns:
            op.add_column('subscriptions',
                sa.Column('tier', sa.String(), nullable=False, server_default='free')
            )
        if "usage_quota" not in columns:
            op.add_column('subscriptions',
                sa.Column('usage_quota', sa.Integer(), nullable=False, server_default='1000')
            )
        if "grace_period_end" not in columns:
            op.add_column('subscriptions',
                sa.Column('grace_period_end', sa.TIMESTAMP(timezone=True), nullable=True)
            )
        if "payment_retry_count" not in columns:
            op.add_column('subscriptions',
                sa.Column('payment_retry_count', sa.Integer(), nullable=False, server_default='0')
            )
        if "last_payment_error" not in columns:
            op.add_column('subscriptions',
                sa.Column('last_payment_error', sa.Text(), nullable=True)
            )
        if "metadata" not in columns:
            op.add_column('subscriptions',
                sa.Column('metadata', postgresql.JSONB(), nullable=False, server_default='{}')
            )

        # Add unique constraint for active subscriptions
        if "uq_one_active_subscription" not in indexes:
            op.execute(
                """
                CREATE UNIQUE INDEX uq_one_active_subscription
                ON subscriptions (organization_id)
                WHERE status IN ('trialing', 'active')
                """
            )

    # Create subscription audit logs table
    if "subscription_audit_logs" not in tables:
        op.create_table(
            'subscription_audit_logs',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('subscription_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('event_type', sa.String(), nullable=False),
            sa.Column('old_value', postgresql.JSONB(), nullable=False),
            sa.Column('new_value', postgresql.JSONB(), nullable=False),
            sa.Column('timestamp', sa.TIMESTAMP(timezone=True), nullable=False),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False),
            sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.Index('ix_subscription_audit_logs_subscription_id', 'subscription_id'),
            sa.Index('ix_subscription_audit_logs_user_id', 'user_id'),
            sa.Index('ix_subscription_audit_logs_event_type', 'event_type'),
            sa.Index('ix_subscription_audit_logs_timestamp', 'timestamp')
        )

    # Create indexes
    if "subscriptions" in tables:
        indexes = {i["name"] for i in inspector.get_indexes("subscriptions")}
        if "ix_subscriptions_tier" not in indexes:
            op.create_index(
                'ix_subscriptions_tier',
                'subscriptions',
                ['tier']
            )
        if "ix_subscriptions_grace_period_end" not in indexes:
            op.create_index(
                'ix_subscriptions_grace_period_end',
                'subscriptions',
                ['grace_period_end']
            )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = {t for t in inspector.get_table_names()}

    if "subscriptions" in tables:
        indexes = {i["name"] for i in inspector.get_indexes("subscriptions")}
        columns = {c["name"]: c for c in inspector.get_columns("subscriptions")}
        fks = {fk["name"] for fk in inspector.get_foreign_keys("subscriptions")}

        # Drop indexes
        if "ix_subscriptions_grace_period_end" in indexes:
            op.drop_index('ix_subscriptions_grace_period_end')
        if "ix_subscriptions_tier" in indexes:
            op.drop_index('ix_subscriptions_tier')
        if "uq_one_active_subscription" in indexes:
            op.drop_index('uq_one_active_subscription')

        # Drop columns
        if "metadata" in columns:
            op.drop_column('subscriptions', 'metadata')
        if "last_payment_error" in columns:
            op.drop_column('subscriptions', 'last_payment_error')
        if "payment_retry_count" in columns:
            op.drop_column('subscriptions', 'payment_retry_count')
        if "grace_period_end" in columns:
            op.drop_column('subscriptions', 'grace_period_end')
        if "usage_quota" in columns:
            op.drop_column('subscriptions', 'usage_quota')
        if "tier" in columns:
            op.drop_column('subscriptions', 'tier')

        # Drop organization_id last
        if "subscriptions_organization_id_fkey" in fks:
            op.drop_constraint('subscriptions_organization_id_fkey', 'subscriptions', type_='foreignkey')
        if "organization_id" in columns:
            op.drop_column('subscriptions', 'organization_id')

    if "subscription_audit_logs" in tables:
        indexes = {i["name"] for i in inspector.get_indexes("subscription_audit_logs")}
        
        # Drop indexes
        if "ix_subscription_audit_logs_timestamp" in indexes:
            op.drop_index('ix_subscription_audit_logs_timestamp')
        if "ix_subscription_audit_logs_event_type" in indexes:
            op.drop_index('ix_subscription_audit_logs_event_type')
        if "ix_subscription_audit_logs_user_id" in indexes:
            op.drop_index('ix_subscription_audit_logs_user_id')
        if "ix_subscription_audit_logs_subscription_id" in indexes:
            op.drop_index('ix_subscription_audit_logs_subscription_id')

        # Drop table
        op.drop_table('subscription_audit_logs')

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('merchants', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Payout',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('merchant', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='payouts', to='merchants.merchant')),
                ('bank_account', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='merchants.bankaccount')),
                ('amount_paise', models.BigIntegerField()),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')],
                    db_index=True,
                    default='pending',
                    max_length=12,
                )),
                ('attempt_count', models.PositiveSmallIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('processing_started_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='IdempotencyKey',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('merchant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='merchants.merchant')),
                ('key', models.CharField(max_length=64)),
                ('response_status', models.PositiveSmallIntegerField()),
                ('response_body', models.JSONField()),
                ('payout', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='payouts.payout')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='idempotencykey',
            unique_together={('merchant', 'key')},
        ),
        migrations.AddIndex(
            model_name='idempotencykey',
            index=models.Index(fields=['merchant', 'key'], name='payouts_ide_merchan_key_idx'),
        ),
    ]

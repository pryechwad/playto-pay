from django.db import migrations


def create_periodic_task(apps, schema_editor):
    IntervalSchedule = apps.get_model('django_celery_beat', 'IntervalSchedule')
    PeriodicTask = apps.get_model('django_celery_beat', 'PeriodicTask')

    schedule, _ = IntervalSchedule.objects.get_or_create(
        every=30,
        period='seconds',
    )
    PeriodicTask.objects.get_or_create(
        name='Requeue stuck payouts',
        defaults={
            'task': 'payouts.tasks.requeue_stuck_payouts',
            'interval': schedule,
            'enabled': True,
        }
    )


def delete_periodic_task(apps, schema_editor):
    PeriodicTask = apps.get_model('django_celery_beat', 'PeriodicTask')
    PeriodicTask.objects.filter(name='Requeue stuck payouts').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('payouts', '0001_initial'),
        ('django_celery_beat', '0018_improve_crontab_helptext'),
    ]

    operations = [
        migrations.RunPython(create_periodic_task, delete_periodic_task),
    ]

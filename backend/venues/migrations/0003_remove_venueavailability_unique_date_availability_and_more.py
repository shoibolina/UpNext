# Generated by Django 4.2.5 on 2025-04-07 02:56

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('venues', '0002_alter_venueavailability_unique_together_and_more'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='venueavailability',
            name='unique_date_availability',
        ),
        migrations.RemoveConstraint(
            model_name='venueavailability',
            name='unique_weekly_availability',
        ),
        migrations.AlterUniqueTogether(
            name='venueavailability',
            unique_together={('venue', 'day_of_week', 'date')},
        ),
    ]

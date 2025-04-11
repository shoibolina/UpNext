# Generated by Django 4.2.5 on 2025-04-07 20:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('venues', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='venueavailability',
            unique_together={('venue', 'day_of_week', 'opening_time', 'closing_time')},
        ),
        migrations.AddField(
            model_name='venueavailability',
            name='repeat_weekly',
            field=models.BooleanField(default=True),
        ),
    ]

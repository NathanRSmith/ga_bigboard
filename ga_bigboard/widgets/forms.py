from django import forms
from Dashboard.forms import CustomEditWidgetSettingsForm
import ga_bigboard.models as ga_models

import pdb

class BigboardChatWidgetForm(CustomEditWidgetSettingsForm):
    
    room = forms.ChoiceField()
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user')
        super(BigboardChatWidgetForm, self).__init__(*args, **kwargs)
        
        #pdb.set_trace()
        
        ROOM_CHOICES = [(room.name, room.name) for room in ga_models.Room.objects.filter(roles__users=user).distinct()]
        
        self.fields['room'].choices = ROOM_CHOICES
    
        
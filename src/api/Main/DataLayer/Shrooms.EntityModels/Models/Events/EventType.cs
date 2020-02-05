﻿using System.Collections.Generic;

namespace Shrooms.EntityModels.Models.Events
{
    public class EventType : BaseModelWithOrg
    {
        public string Name { get; set; }

        public bool IsSingleJoin { get; set; }

        public string SingleJoinGroupName { get; set; }

        public bool SendWeeklyReminders { get; set; }

        public bool IsShownWithAllEvents { get; set; }

        public virtual ICollection<Event> Events { get; set; }
    }
}

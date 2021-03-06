﻿using System;
using System.Collections.Generic;
using Microsoft.AspNet.Identity.EntityFramework;
using Shrooms.Contracts.DataTransferObjects;

namespace Shrooms.DataLayer.EntityModels.Models
{
    public class ApplicationRole : IdentityRole, ISoftDelete, IOrganization
    {
        public ApplicationRole()
        {
        }

        public ApplicationRole(string roleName, int organizationId)
            : base(roleName)
        {
            OrganizationId = organizationId;
            CreatedTime = DateTime.UtcNow;
        }

        public new string Name
        {
            get => base.Name;
            set => base.Name = value;
        }

        public int OrganizationId { get; set; }

        public Organization Organization { get; set; }

        public virtual ICollection<Permission> Permissions { get; set; }

        public DateTime CreatedTime { get; set; }
    }
}

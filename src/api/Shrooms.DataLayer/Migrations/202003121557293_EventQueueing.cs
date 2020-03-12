namespace Shrooms.DataLayer.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class EventQueueing : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Events", "IsQueueEnabled", c => c.Boolean(nullable: false));
            Sql("UPDATE dbo.Events SET IsQueueEnabled = 0");
        }
        
        public override void Down()
        {
            DropColumn("dbo.Events", "IsQueueEnabled");
        }
    }
}

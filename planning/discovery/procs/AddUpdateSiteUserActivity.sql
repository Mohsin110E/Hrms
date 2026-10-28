-- =============================================
-- Author:		Krishna
-- Create date: 12/10/2019
-- Description:	<Description,,>
--select * from usr.SiteUser
-- =============================================
CREATE PROCEDURE AddUpdateSiteUserActivity 
(
   @ProfileId int = null,
   @LastLogin datetime = null,
   @LastIPUsed nvarchar(100) = null,
   @PasswodChanged datetime = null,
   @IsPasswordReset bit = null,
   @FailedLoginAttemptCount int,
   @IsUserLocked bit = null,
   @FailedLoginAttemptDate datetime = null   
)
AS
BEGIN

	SET NOCOUNT ON;
	BEGIN TRANSACTION
	BEGIN TRY	
	Declare @profileIdPresent smallint=0
	select @profileIdPresent= count(ProfileId) from [usr].[SiteUserActivity] where ProfileId = @ProfileId
	if(@profileIdPresent =0)
    Begin
        insert into [usr].[SiteUserActivity] (ProfileId,LastLogin,LastIPUsed,PasswordChanged,IsPasswordReset,FailedLoginAttemptCount,IsUserLocked,FailedLoginAttemptDate)
        values (@ProfileId,@LastLogin,@LastIPUsed,@PasswodChanged,@IsPasswordReset,@FailedLoginAttemptCount,@IsUserLocked,@FailedLoginAttemptDate)	 
    END
	Else
    Begin
	   declare @FailedLoginAttempt SMALLINT =0
	   if(@FailedLoginAttemptCount > 0)
	     BEGIN		  
		   select @FailedLoginAttempt = FailedLoginAttemptCount + 1 from [usr].[SiteUserActivity] where ProfileId = @ProfileId
		 END
          update [usr].[SiteUserActivity] set
           LastLogin=@LastLogin,
		   LastIPUsed=@LastIPUsed,
		   --PasswodChanged=@PasswodChanged,
		   --IsPasswordReset=@IsPasswordReset,
		   FailedLoginAttemptCount=case when @FailedLoginAttempt = 0 then @FailedLoginAttemptCount else @FailedLoginAttempt end,
		   IsUserLocked= case when @FailedLoginAttempt >= 5 then 1 else @IsUserLocked end,
		   FailedLoginAttemptDate=@FailedLoginAttemptDate
           where ProfileId = @ProfileId

    End 
    COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        if XACT_STATE() <> 0
            ROLLBACK TRANSACTION
             Insert into system.ExceptionLog (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage, ErrorFrom,CreatedOn)
             SELECT  ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(), ERROR_MESSAGE(), 'SP - AddUpdateSiteUserActivity',GETUTCDATE()
             	 DECLARE @ErrorMessage VARCHAR(2000)
	             SELECT @ErrorMessage = ERROR_MESSAGE()
	             RAISERROR (@ErrorMessage, 16, 1)     
    END CATCH
 --select @MessageText 
END


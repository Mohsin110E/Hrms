-- =============================================
-- Author:		Mohseena	
-- Create date: 12/12/2019
-- Description:	Add Update Menu function 
--[AddUpdateMenuUserType] 4,'16,17,22,48'

/* 
   role Id - from role Table 
   @CustomIdType is Sql type its containes list of MenuItemid 
*/ 
-- =============================================
CREATE Procedure AddUpdateMenuUserType
@UserTypeId tinyint,
@MenuItemType MenuItemType Readonly 
	AS
		BEGIN
			Set NOCOUNT OFF
			Begin TRANSACTION
				Begin Try
			
				MERGE system.MenuUserType T
				USING @MenuItemType S
				ON (S.MenuItemId = T.MenuItemId and T.UserTypeId  = @UserTypeId)
				WHEN NOT MATCHED BY TARGET --Inserting the New Data
				THEN INSERT (MenuItemId,UserTypeId,PageUrl) VALUES (S.MenuItemId, @UserTypeId,S.PageUrl )
				WHEN NOT MATCHED BY SOURCE  and T.UserTypeId = @UserTypeId THEN 
				DELETE  ;

			Set NOCOUNT ON
	COMMIT TRANSACTION
		End Try
	BEGIN CATCH
		IF XACT_STATE() <> 0 
			BEGIN
					ROLLBACK TRANSACTION
			END
		Insert into system.ExceptionLog (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage, ErrorFrom,CreatedOn)
		SELECT  ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(), ERROR_MESSAGE(), 'SP - AddUpdateMenuFunction',GETUTCDATE()
		DECLARE @ErrorMessage VARCHAR(2000)
		SELECT @ErrorMessage = ERROR_MESSAGE()
		RAISERROR ('Failed to Register', 16, 1)

		Set NOCOUNT ON
	END CATCH;


END



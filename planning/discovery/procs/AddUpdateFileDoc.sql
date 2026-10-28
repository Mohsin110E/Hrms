-- =============================================
-- Author:		krishna	
-- Create date: 24/10/2019
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE AddUpdateFileDoc	
(  
   @FileDocId bigint = null,   
   @DocName varchar(500)=null,
   @FolderPath  varchar(1000) = null,
   @FileDocType smallint= null,
   @CreatedBy int = null,
   @FileDocIdResult as bigint =0 OUT

  
)
AS
BEGIN
	SET NOCOUNT ON;
    BEGIN TRANSACTION
    BEGIN TRY
       
        if(@FileDocId = 0)
       set @FileDocId = null

     Declare @CreatedDate datetime = GetUtcdate()
        -- insert address
        if(@FileDocId is null)
         Begin
           insert into master.FileDoc(DocName,FolderPath,FileDocTypeId,CreatedBy,CreatedOn)
           values (@DocName,@FolderPath,1,@CreatedBy,@CreatedDate)
           Set @FileDocId = IDENT_CURRENT('master.FileDoc') 
             
		
         End
        Else
         Begin 
         
             update master.FileDoc set
             DocName = (Case When @DocName is null then DocName else @DocName end), 
             FolderPath = (Case When @FolderPath is null then FolderPath else @FolderPath end), 
             FileDocTypeId = (Case When @FileDocType is null then FileDocTypeId else @FileDocType end)
             where FileDocId = @FileDocId
         End 
         Set @FileDocIdResult = @FileDocId
       
    COMMIT TRANSACTION
    END TRY
    BEGIN CATCH 
     if XACT_STATE() <> 0
       ROLLBACK TRANSACTION
     Insert into system.ExceptionLog (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage, ErrorFrom,CreatedOn)
	 SELECT  ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(), ERROR_MESSAGE(), 'SP - AddUpdateFileDoc',GETUTCDATE()
	 DECLARE @ErrorMessage VARCHAR(2000)
	 SELECT @ErrorMessage = ERROR_MESSAGE()
	 RAISERROR (@ErrorMessage, 16, 1)      
   END CATCH
END


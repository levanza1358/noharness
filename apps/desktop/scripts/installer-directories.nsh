!include "LogicLib.nsh"

Var nhsFinalDirectory
Var nhsNewDirectory
Var nhsOldDirectory
Var nhsOldMoved
Var nhsNewMoved
Var nhsDirectoryError
Var nhsDirectorySource
Var nhsDirectoryDestination
Var nhsRestoreError
Var nhsDirectoryLogDirectory
Var nhsRecoveryStopped

; MoveFileEx preserves the destination and exposes the Windows error before rollback changes it.
; Open files inside a directory can make its rename return access denied (5).
!macro nhsDirectoryOperation SOURCE DESTINATION RESULT PHASE
  Push $0
  Push $1
  Push $2
  StrCpy $0 0
  ${Do}
    ${If} "${DESTINATION}" == ""
      System::Call 'kernel32::RemoveDirectoryW(w "${SOURCE}") i.r1 ?e'
    ${Else}
      System::Call 'kernel32::MoveFileExW(w "${SOURCE}", w "${DESTINATION}", i 0) i.r1 ?e'
    ${EndIf}
    Pop ${RESULT}
    ${If} "${DESTINATION}" == ""
      ${If} ${RESULT} == 2
      ${OrIf} ${RESULT} == 3
        StrCpy $1 1
      ${EndIf}
    ${EndIf}
    ${If} $1 != 0
      StrCpy ${RESULT} 0
      ${ExitDo}
    ${EndIf}
    ClearErrors
    FileOpen $2 "$PLUGINSDIR\directory-operations.log" a
    ${IfNot} ${Errors}
      FileSeek $2 0 END
      FileWrite $2 "${PHASE}: Windows error: ${RESULT}$\r$\n"
      FileClose $2
    ${EndIf}
    ${If} ${RESULT} != 5
    ${AndIf} ${RESULT} != 32
    ${AndIf} ${RESULT} != 33
      ${ExitDo}
    ${EndIf}
    IntOp $0 $0 + 1
    ${If} $0 >= 10
      ${ExitDo}
    ${EndIf}
    IntOp $1 $0 * 250
    Sleep $1
  ${Loop}
  Pop $2
  Pop $1
  Pop $0
!macroend

!macro nhsReportDirectoryFailure
  ${If} $nhsRestoreError != 0
    StrCpy $nhsRecoveryStopped "1"
  ${EndIf}
  !ifmacrodef customInstallerDirectoryFailed
    !insertmacro customInstallerDirectoryFailed
  !else
    DetailPrint "Directory operation failed ($nhsDirectoryError): $nhsDirectorySource -> $nhsDirectoryDestination; restore error: $nhsRestoreError"
  !endif
!macroend

!macro nhsExtractPayload FILE
  !ifmacrodef customInstallerExtract
    !insertmacro customInstallerExtract "${FILE}"
  !else
    nsExec::ExecToStack '"$PLUGINSDIR\nhs-7za.exe" x -y -bd -bb0 "-o$INSTDIR" "${FILE}"'
    Pop $R0
    Pop $R1
  !endif
  ${If} $R0 != 0
    DetailPrint $R1
    Call nhsRollbackDirectories
    !ifmacrodef customInstallerExtractFailed
      !insertmacro customInstallerExtractFailed "${FILE}"
    !else
      MessageBox MB_OK|MB_ICONEXCLAMATION "$(decompressionFailed)" /SD IDOK
    !endif
    SetErrorLevel 2
    Quit
  ${EndIf}
!macroend

!macro nhsStageApplication
  !ifdef NHS_INSTALLER_LOG_DIR
    ; electron-builder defines the cache name after including our function bodies, before this section expands.
    StrCpy $nhsDirectoryLogDirectory "${NHS_INSTALLER_LOG_DIR}"
  !endif
  StrCpy $nhsFinalDirectory $INSTDIR
  System::Call 'ole32::CoCreateGuid(g .r0) i .r1'
  ${If} $1 != 0
    SetErrorLevel 2
    Quit
  ${EndIf}
  StrCpy $nhsNewDirectory "$INSTDIR.new-$0"
  StrCpy $nhsOldDirectory "$INSTDIR.old-$0"
  StrCpy $nhsOldMoved ""
  StrCpy $nhsNewMoved ""
  StrCpy $nhsDirectoryError 0
  StrCpy $nhsRestoreError 0
  StrCpy $nhsRecoveryStopped ""
  ClearErrors
  CreateDirectory $nhsNewDirectory
  ${If} ${Errors}
    SetErrorLevel 2
    Quit
  ${EndIf}
  File /oname=$PLUGINSDIR\nhs-7za.exe "${NHS_SEVENZIP_PATH}"
  StrCpy $INSTDIR $nhsNewDirectory
  SetOutPath $INSTDIR
  !insertmacro installApplicationFiles
  !ifdef NHS_SEVENZIP_LICENSE_DIR
    File /oname=7zip-installer-LICENSE.txt "${NHS_SEVENZIP_LICENSE_DIR}\LICENSE.txt"
    File /oname=7zip-installer-COPYING.txt "${NHS_SEVENZIP_LICENSE_DIR}\COPYING"
  !endif
  !ifdef UNINSTALLER_ICON
    File /oname=uninstallerIcon.ico "${UNINSTALLER_ICON}"
  !endif
  StrCpy $INSTDIR $nhsFinalDirectory
  SetOutPath $PLUGINSDIR
!macroend

Function .onGUIEnd
  Call nhsCleanupDirectories
FunctionEnd

Function nhsCleanupDirectories
  ${If} $nhsRecoveryStopped == "1"
    Return
  ${EndIf}
  ${If} $nhsFinalDirectory != ""
    Call nhsRollbackDirectories
  ${EndIf}
FunctionEnd

; Only directories created or renamed by this installer are removed during rollback.
Function nhsRollbackDirectories
  SetOutPath $PLUGINSDIR
  ${If} $nhsNewMoved == "1"
    RMDir /r "\\?\$nhsFinalDirectory"
    StrCpy $nhsNewMoved ""
  ${EndIf}
  ${If} $nhsOldMoved == "1"
    !insertmacro nhsDirectoryOperation "$nhsOldDirectory" "$nhsFinalDirectory" $nhsRestoreError "restore"
    ${If} $nhsRestoreError != 0
      ; Leave the complete backup in place if another process prevents restoration.
      DetailPrint $nhsOldDirectory
      RMDir /r "\\?\$nhsNewDirectory"
      Return
    ${EndIf}
    StrCpy $nhsOldMoved ""
  ${EndIf}
  ${If} $nhsNewDirectory != ""
    RMDir /r "\\?\$nhsNewDirectory"
  ${EndIf}
  StrCpy $INSTDIR $nhsFinalDirectory
FunctionEnd

Function nhsPromoteDirectories
  !ifmacrodef InstallerPublishStage
    !insertmacro InstallerPublishStage 2
  !endif
  ; SetOutPath opens a directory handle; release it before either rename.
  SetOutPath $PLUGINSDIR
  ClearErrors
  ${If} ${FileExists} "$nhsFinalDirectory\*.*"
    StrCpy $nhsDirectorySource $nhsFinalDirectory
    StrCpy $nhsDirectoryDestination $nhsOldDirectory
    !insertmacro nhsDirectoryOperation "$nhsDirectorySource" "$nhsDirectoryDestination" $nhsDirectoryError "backup"
    ${If} $nhsDirectoryError != 0
      Call nhsRollbackDirectories
      !insertmacro nhsReportDirectoryFailure
      SetErrors
      Return
    ${EndIf}
    StrCpy $nhsOldMoved "1"
  ${Else}
    ; NSIS can create the destination before the install section starts.
    StrCpy $nhsDirectorySource $nhsFinalDirectory
    StrCpy $nhsDirectoryDestination ""
    !insertmacro nhsDirectoryOperation "$nhsDirectorySource" "" $nhsDirectoryError "remove-empty"
    ${If} $nhsDirectoryError != 0
      Call nhsRollbackDirectories
      !insertmacro nhsReportDirectoryFailure
      SetErrors
      Return
    ${EndIf}
  ${EndIf}
  ClearErrors
  StrCpy $nhsDirectorySource $nhsNewDirectory
  StrCpy $nhsDirectoryDestination $nhsFinalDirectory
  !insertmacro nhsDirectoryOperation "$nhsDirectorySource" "$nhsDirectoryDestination" $nhsDirectoryError "promote"
  ${If} $nhsDirectoryError != 0
    Call nhsRollbackDirectories
    !insertmacro nhsReportDirectoryFailure
    SetErrors
    Return
  ${EndIf}
  StrCpy $nhsNewMoved "1"
  SetOutPath $nhsFinalDirectory
  !ifmacrodef InstallerPublishStage
    !insertmacro InstallerPublishStage 3
  !endif
  ClearErrors
FunctionEnd

!macro nhsFinishDirectories
  StrCpy $nhsNewMoved ""
  ${If} $nhsOldMoved == "1"
    RMDir /r "\\?\$nhsOldDirectory"
    StrCpy $nhsOldMoved ""
  ${EndIf}
!macroend

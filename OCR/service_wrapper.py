"""
Windows Service wrapper for OCR API Server
Install: python service_wrapper.py install
Start: python service_wrapper.py start
Stop: python service_wrapper.py stop
Remove: python service_wrapper.py remove
"""

import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import sys
import os
import subprocess
import time

class OCRAPIService(win32serviceutil.ServiceFramework):
    _svc_name_ = "FoodConnectOCRAPI"
    _svc_display_name_ = "FoodConnect OCR API Service"
    _svc_description_ = "OCR API service for FoodConnect food analysis"

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        self.process = None
        socket.setdefaulttimeout(60)

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        if self.process:
            self.process.terminate()

    def SvcDoRun(self):
        servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE,
                              servicemanager.PYS_SERVICE_STARTED,
                              (self._svc_name_, ''))
        self.main()

    def main(self):
        # Get the directory where this script is located
        service_dir = os.path.dirname(os.path.abspath(__file__))
        api_script = os.path.join(service_dir, 'api_server.py')
        
        while True:
            try:
                # Start the API server
                self.process = subprocess.Popen([
                    sys.executable, api_script
                ], cwd=service_dir)
                
                servicemanager.LogInfoMsg(f"OCR API Server started with PID: {self.process.pid}")
                
                # Wait for stop signal or process to end
                while True:
                    if win32event.WaitForSingleObject(self.hWaitStop, 1000) == win32event.WAIT_OBJECT_0:
                        # Service stop requested
                        if self.process:
                            self.process.terminate()
                        return
                    
                    if self.process.poll() is not None:
                        # Process ended unexpectedly, restart it
                        servicemanager.LogErrorMsg("OCR API Server crashed, restarting...")
                        break
                        
            except Exception as e:
                servicemanager.LogErrorMsg(f"Error starting OCR API Server: {str(e)}")
                time.sleep(5)  # Wait before retry

if __name__ == '__main__':
    win32serviceutil.HandleCommandLine(OCRAPIService)
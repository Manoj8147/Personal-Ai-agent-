import threading
import webview
import os
import sys
from app import app


def run_server():
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)


if __name__ == '__main__':
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    webview.create_window(
        'AI Interview Assistant',
        'http://127.0.0.1:5000',
        width=1400,
        height=900,
        resizable=True
    )
    webview.start()

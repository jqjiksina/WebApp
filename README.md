# AiWeb
Access
`http://222.20.98.159:5180/`，
inside **School NetWork** !!!

## Deployment Guidelines
快速从0部署（先件：nginx、conda、npm、docker、tmux）：

``` shell
git clone https://github.com/HUST-IC-LLM/Hust_System_With_AI
cd Hust_System_With_AI    # 进入项目文件夹
git submodule init         # 从github下载子模块
git submodule update
cd ragflow/docker            # 从docker容器后台启动mysql
docker compose up -d
cd ../..
tmux new -s livetalking    # 从tmux后台挂上数字人推流服务
cd Livetalking
./start.sh                    ## （写好的启动命令脚本，可以修改选项）
tmux detach
tmux new -s backend        # 从tmux启动后端服务
cd webAi_backEnd
conda activate webAi       ## conda后端python代码的运行环境，可                  自行创建
conda create --name aiweb ## 创建虚拟环境名为aiweb
conda activate aiweb
pip install requirements.txt ## 安装依赖
python app/main.py            ## 正式启动后端服务
tmux detach
tmux new -s frontend        # 从tmux启动前端服务
cd webAi_frontEnd            
npm run dev                    ## 调试型启动，热加载本地服务器
npm run build                  ## 生产环境下构建项目dist目录，后续可转nginx代理，二者只需执行其一即可。
```

按照以上步骤执行完毕后，这里以nginx（方便解决CORS跨域访问问题）为例，代理项目。参考配置如下： 
``` Nginx
server {
    # 监听前端地址
    listen 5180;
    server_name 222.20.98.159;
    
    location / {
	root /home/jhyang/AiWeb/webAi_frontEnd/dist;
	index index.html;
	try_files $uri $uri/ /index.html;
    }

    location /docSite/ {
        alias /home/jhyang/AiWeb/testdocs/site/;
	index index.html;
        try_files $uri $uri/ /docSite/index.html;
        
        # 解决 MkDocs 资源加载问题
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires max;
            add_header Cache-Control "public, no-transform";
        }
	error_page 404 /docSite/404.html;
    }
    
    # 反向代理后端API（所有以/api开头的请求转发到后端）
    location /api {
        proxy_pass http://localhost:8888;  # 后端服务地址
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

	# 可选：调整超时时间
        proxy_connect_timeout 60s;
    	proxy_read_timeout 600s;
        proxy_send_timeout 601s;
    }
    
    # 数字人API代理
    location /digitalperson/ {
        proxy_pass http://localhost:8010/;
        
        # WebRTC必要配置
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        # 额外的WebRTC相关配置
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 确保所有HTTP方法可用
        proxy_method $request_method;

        # 增加超时时间
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        # CORS头已不需要，因为请求现在来自同一域
    }
    
    # WebSocket代理
    location /ws {
        proxy_pass http://localhost:8888;  # 必须指向WebSocket后端地址
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

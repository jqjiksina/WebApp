conda activate webAi

cd ragflow/docker

docker compose up -d

cd ../../

:: cd ../../ollama

:: docker-compose up -d % 启动ollama %

cd webAi_backEnd

docker-compose up -d % 启动mysql %

python webAi_backEnd/app/main.py

conda deactivate

cd webAi_frontEnd

npm run dev
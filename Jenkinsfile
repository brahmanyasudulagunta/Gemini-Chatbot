pipeline {
    agent any

    environment {
        // Docker Hub Credentials
        // IMPORTANT: Replace this with your actual Docker Hub username!
        DOCKERHUB_USERNAME = "brahmanya"

        // Frontend Variables
        IMAGE_NAME = "${DOCKERHUB_USERNAME}/chatgpt-frontend"
        CONTAINER_NAME = "frontend"
        PORT = "5173"
        
        // Backend Variables
        BACKEND_IMAGE_NAME = "${DOCKERHUB_USERNAME}/chatgpt-backend"
        BACKEND_CONTAINER_NAME = "backend"
        BACKEND_PORT = "8000"
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "Checking out source code..."
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                echo "Building and Pushing Docker images..."
                script {
                    // Make sure 'dockerhub' credentials ID exists in Jenkins
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                        // Build Images
                        sh 'cd frontend && docker build -t $IMAGE_NAME .'
                        sh 'cd backend && docker build -t $BACKEND_IMAGE_NAME .'
                        
                        // Push Images
                        sh 'docker push $IMAGE_NAME'
                        sh 'docker push $BACKEND_IMAGE_NAME'
                    }
                }
             }
        }   
        
        stage('Stop Old Containers') {
            steps {
                sh 'docker rm -f $CONTAINER_NAME || true'
                sh 'docker rm -f $BACKEND_CONTAINER_NAME || true'
            }
        }

        stage('Run New Containers') {
            steps {
                // Run Backend
                // Note: Make sure to add a Jenkins credential named 'openai_api_key' 
                // containing your OpenAI API Key secret text.
                withCredentials([string(credentialsId: 'openai_api_key', variable: 'OPENAI_API_KEY')]) {
                    sh '''
                      docker run -d \
                        -p ${BACKEND_PORT}:8000 \
                        --name $BACKEND_CONTAINER_NAME \
                        -e OPENAI_API_KEY=$OPENAI_API_KEY \
                        $BACKEND_IMAGE_NAME
                    '''
                }

                // Run Frontend
                sh '''
                  docker run -d \
                    -p ${PORT}:5173 \
                    --name $CONTAINER_NAME \
                    -e VITE_BACKEND_API_URL="http://localhost:8000/api/chat" \
                    $IMAGE_NAME
                '''
            }
        }

        stage('Verify Deployments') {
            steps {
                sh 'docker ps | grep $CONTAINER_NAME'
                sh 'docker ps | grep $BACKEND_CONTAINER_NAME'
            }
        }
    }

    post {
        success {
            echo "Deployment complete!"
        }
        failure {
            echo "Build failed."
        }
    }
}

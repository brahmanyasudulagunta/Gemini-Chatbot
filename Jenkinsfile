pipeline {
    agent any

    environment {
        IMAGE_NAME = "vite"
        CONTAINER_NAME = "vite-container"
        PORT = "5173"
        VITE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "Checking out source code..."
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image with credentials..."
               // Wrap the docker command in a script block
               script {
                   docker.withRegistry('https://index.docker.io', 'dockerhub') {
                   sh 'docker build -t $IMAGE_NAME .'
                      }
                }
             }
        }   
        
        stage('Stop Old Container') {
            steps {
                sh 'docker rm -f $CONTAINER_NAME || true'
            }
        }

        stage('Run New Container') {
            steps {
                withCredentials([string(credentialsId: 'gemini', variable: 'GEMINI_API_KEY')]) {
                    sh '''
                      docker run -d \
                        -p ${PORT}:5173 \
                        --name $CONTAINER_NAME \
                        -e VITE_API_KEY=$GEMINI_API_KEY \
                        -e VITE_API_URL=$VITE_API_URL \
                        $IMAGE_NAME
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                sh 'docker ps | grep $CONTAINER_NAME'
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

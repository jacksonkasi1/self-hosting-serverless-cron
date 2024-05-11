# Selfhosting Serverless Cron

Welcome to the Selfhosting Serverless Cron project! This solution allows you to manage and execute scheduled tasks using AWS Lambda and Amazon EventBridge, making it easy to automate your workflows without managing any servers.

## Features

- **Dynamic Cron Job Management:** Easily create, update, delete, and list cron jobs through a RESTful API.
- **AWS Lambda Integration:** Execute tasks using AWS Lambda, allowing the seamless running of code in response to events.
- **Secure Access:** Each operation requires API keys and project-specific secret keys to ensure secure access to the functionality.

## Quick Start

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourgithub/selfhosting-serverless-cron.git
   cd selfhosting-serverless-cron
   ```

2. **Set up AWS credentials:**

   Make sure you have configured your AWS credentials that have access to Lambda and EventBridge.

3. **Deploy the application:**

   ```bash
   serverless deploy
   ```

4. **Using the API:**

   To start using the API, send requests to the endpoints defined in the [API documentation](https://serverless-cron.apidog.io/).

## API Documentation

For detailed information about the API routes, request formats, and responses, please refer to the [official API documentation](https://serverless-cron.apidog.io/). Here you can find examples and descriptions for each endpoint used to manage your cron jobs.

## Architecture

This project uses the following AWS services:

- **AWS Lambda:** Runs the backend logic without provisioning or managing servers.
- **Amazon EventBridge:** Manages the schedule and triggers configured cron jobs to execute on AWS Lambda.
- **AWS IAM:** Manages secure access to AWS services.

## Configuration

To configure the application, adjust the environment variables in `serverless.yml` as needed:

- `AWS_REG`: AWS Region where services are deployed.
- `AWS_ACC_KEY_ID`: AWS Access Key.
- `AWS_SEC_ACCESS_KEY`: AWS Secret Access Key.
- `WORKER_LAMBDA_ARN`: ARN of the Lambda function that will execute the cron jobs.
- `DATABASE_URL`: Turso DB URL
- `DATABASE_AUTH_TOKEN`: Turso DB auth token


## Contributing

Contributions are welcome! Please feel free to submit pull requests, create issues, or suggest improvements via the GitHub repository.

## Support

If you encounter any issues or require assistance, please file an issue on the GitHub repository, and the maintainers will help you resolve it.

## License

This project is licensed under the MIT License - see the LICENSE file in the repository for details.


## resources

    - https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-cron-expressions.html
    - https://s3anmcdowell.medium.com/declarative-decorating-in-aws-lambdas-d27e39de6f02

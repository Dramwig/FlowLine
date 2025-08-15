import os
from tqdm import tqdm
import pandas as pd

current_path = os.path.dirname(os.path.abspath(__file__))
todo_file_path = os.path.join(current_path, "todo.csv") # `.csv` or `.xlsx` or `.json`

def config_generator():
    """
    A generator function that yields configuration parameters.
    """
    configs = {
        "data_name": ["rotate_mnist", "color_mnist", "portraits"],
        "model_name": ["cnn", "vgg", "resnet"],
        "method_name": ["GST", "GOAT", "GDO", "GAS"],
        "domain_num": [2, 3, 4, 5, 6],
        "seed": [1, 2, 3, 4, 5]
    }

    for data_name in configs["data_name"]:
        for model_name in configs["model_name"]:
            for method_name in configs["method_name"]:
                for domain_num in configs["domain_num"]:
                    for seed in configs["seed"]:
                        yield {
                            "data_name": data_name,
                            "model_name": model_name,
                            "method_name": method_name,
                            "domain_num": domain_num,
                            "seed": seed
                        }
    
def process_configs():
    """
    Process the configuration parameters using the generator and store them in an Excel file.
    """
    # Create DataFrame from generator
    configs = list(config_generator())
    df = pd.DataFrame(configs)
    
    # Add 'is_run' column initialized to False
    df['run_num'] = 0
    
    # Save to Excel if file doesn't exist, otherwise load and update
    if os.path.exists(todo_file_path):
        existing_df = pd.read_excel(todo_file_path)
        df = df.merge(existing_df[['data_name', 'model_name', 'method_name', 'domain_num', 'seed', 'run_num']], 
                      on=['data_name', 'model_name', 'method_name', 'domain_num', 'seed', 'run_num'], 
                      how='left')
        # print(df)
        df['run_num'] = df['run_num'].fillna(0)
    
    # Process only unrun configurations
    for config in tqdm(configs):
        if not df[(df['data_name'] == config['data_name']) & 
                  (df['model_name'] == config['model_name']) & 
                  (df['method_name'] == config['method_name']) & 
                  (df['domain_num'] == config['domain_num']) & 
                  (df['seed'] == config['seed'])]['run_num'].iloc[0]:
            df.loc[(df['data_name'] == config['data_name']) & 
                   (df['model_name'] == config['model_name']) & 
                   (df['method_name'] == config['method_name']) & 
                   (df['domain_num'] == config['domain_num']) & 
                   (df['seed'] == config['seed']), 'run_num'] = 0
    
    # Save to Excel or CSV
    if todo_file_path.endswith(".xlsx"):
        df.to_excel(todo_file_path, index=False)
    elif todo_file_path.endswith(".csv"):
        df.to_csv(todo_file_path, index=False)
    elif todo_file_path.endswith(".json"):
        df.to_json(todo_file_path, orient="records", force_ascii=False, indent=4)
    else:
        raise ValueError("Invalid file extension. Please use .xlsx, .csv, or .json.")

if __name__ == "__main__":
    process_configs()


import json
import random

DATASET_PATH = 'docs/large-sample-tutor-training-data.jsonl'
TRAIN_TEST_SPLIT_RATIO = 0.8

def load_dataset():
    """Loads the full dataset from the JSONL file."""
    with open(DATASET_PATH, 'r') as f:
        return [json.loads(line) for line in f]

def view_data(dataset, num_entries=5):
    """Prints a specified number of entries from a given dataset."""
    print(f"--- Displaying {num_entries} sample entries ---")
    for i, entry in enumerate(random.sample(dataset, num_entries)):
        print(f"\n----- Entry {i+1} -----")
        print(f"Instruction:\n{entry['instruction']}\n")
        print(f"Ideal Response:\n{entry['response']}\n")
    print("--------------------------------------")


def simulate_training_and_testing():
    """
    This function simulates the process of splitting data for training and testing,
    and demonstrates how one would evaluate a model's performance.
    """
    print("Loading the 1000-entry dataset...")
    full_dataset = load_dataset()
    print(f"Successfully loaded {len(full_dataset)} entries.")

    # 1. Split the data
    split_index = int(len(full_dataset) * TRAIN_TEST_SPLIT_RATIO)
    training_data = full_dataset[:split_index]
    testing_data = full_dataset[split_index:]

    print(f"\nDataset split into:")
    print(f"- {len(training_data)} entries for training.")
    print(f"- {len(testing_data)} entries for testing/evaluation.")
    
    # 2. Simulate "Training"
    print("\n--- Simulating Training ---")
    print("In a real scenario, the following training data would be used to fine-tune the model.")
    print("The model would learn the patterns from these instructions and desired responses.")
    view_data(training_data, num_entries=2)

    # 3. Simulate "Testing" / "Evaluation"
    print("\n--- Simulating Testing/Evaluation ---")
    print("To test the model, we take an entry from our testing set and compare the model's live output to the ideal response.")
    
    # Let's take one random example from the test set
    test_entry = random.choice(testing_data)
    
    print("\n----- Example Test Case -----")
    print("We would provide the following INSTRUCTION to the AI model:")
    print("-----------------------------")
    print(test_entry['instruction'])
    print("\n-----------------------------")
    
    print("\nWe would then compare the AI's live response to the following IDEAL RESPONSE from our dataset:")
    print("-----------------------------")
    print(test_entry['response'])
    print("\n-----------------------------")
    print("By comparing the two, we can evaluate the model's performance and identify areas for improvement.")


def main():
    """Main function to run the simulation script."""
    print("=====================================================")
    print("  AI Model Training and Evaluation Simulation")
    print("=====================================================")
    print("This script will guide you through viewing the dataset and simulating a train/test workflow.\n")

    # Show some data first
    print("First, let's view some random entries from the full 1000-entry dataset.")
    all_data = load_dataset()
    view_data(all_data, num_entries=3)

    # Run the simulation
    simulate_training_and_testing()

    print("\nTo run this script yourself, open a terminal and execute:")
    print("python scripts/simulate_and_view.py\n")


if __name__ == '__main__':
    main()

    

<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $policyFile = $_POST['policyFile'] ?? '';

    if (empty($name) || empty($email) || empty($policyFile)) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $record = date('Y-m-d H:i:s') . ",$name,$email,$policyFile\n";
    $result = file_put_contents('policy_views.csv', $record, FILE_APPEND);

    if ($result === false) {
        echo json_encode(['success' => false, 'message' => 'Error writing to file']);
    } else {
        echo json_encode(['success' => true, 'policyFile' => $policyFile]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
